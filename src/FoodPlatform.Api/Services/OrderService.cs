using System.Text.RegularExpressions;
using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.Domain;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Orchestrates all order-lifecycle operations.
/// (SRP: all order business logic in one place — postcode validation, hours checking,
///  price snapshotting, state machine transitions, dispute handling)
/// (OCP: delegates status transitions to OrderStatusMachine — no hardcoded arrays here)
/// (DIP: controllers depend on IOrderService, not DbContext; IBackgroundJobClient replaces static BackgroundJob)
/// </summary>
public class OrderService : IOrderService
{
    private static readonly Regex PostcodeRegex =
        new(@"^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly FoodPlatformDbContext _db;
    private readonly IStripeService _stripe;
    private readonly IBackgroundJobClient _jobs;
    private readonly ILogger<OrderService> _logger;

    public OrderService(FoodPlatformDbContext db, IStripeService stripe,
        IBackgroundJobClient jobs, ILogger<OrderService> logger)
    {
        _db = db;
        _stripe = stripe;
        _jobs = jobs;
        _logger = logger;
    }

    public async Task<ServiceResult<OrderDto>> PlaceOrderAsync(PlaceOrderRequest request, int userId)
    {
        // Idempotency: return existing order if the same key was already processed
        var existing = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Restaurant)
            .FirstOrDefaultAsync(o => o.IdempotencyKey == request.IdempotencyKey && o.UserId == userId);
        if (existing != null)
            return ServiceResult<OrderDto>.Ok(MapToDto(existing));

        if (!PostcodeRegex.IsMatch(request.DeliveryPostcode))
            return ServiceResult<OrderDto>.Fail(OrderServiceError.ValidationFailed, "Invalid UK postcode");

        var restaurant = await _db.Restaurants
            .Include(r => r.Hours)
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId && r.IsActive);

        if (restaurant == null)
            return ServiceResult<OrderDto>.Fail(OrderServiceError.ValidationFailed, "Restaurant not found or inactive");

        var now = DateTime.UtcNow;
        var todayHours = restaurant.Hours.FirstOrDefault(h => h.DayOfWeek == (int)now.DayOfWeek);
        if (todayHours == null || todayHours.IsClosed ||
            now.TimeOfDay < todayHours.OpenTime || now.TimeOfDay > todayHours.CloseTime)
            return ServiceResult<OrderDto>.Fail(OrderServiceError.ValidationFailed, "Restaurant is currently closed");

        // Deduplicate: merge identical MenuItemIds so we never create two rows for the same item.
        var deduplicatedItems = request.Items
            .GroupBy(i => i.MenuItemId)
            .Select(g => new OrderItemRequest(g.Key, g.Sum(x => x.Quantity)))
            .ToList();

        var menuItemIds = deduplicatedItems.Select(i => i.MenuItemId).ToList();
        var menuItems = await _db.MenuItems
            .Where(m => menuItemIds.Contains(m.Id) && m.RestaurantId == request.RestaurantId && m.IsAvailable)
            .ToDictionaryAsync(m => m.Id);

        if (menuItems.Count != menuItemIds.Distinct().Count())
            return ServiceResult<OrderDto>.Fail(OrderServiceError.ValidationFailed, "One or more items are unavailable");

        decimal total = 0;
        var orderItems = new List<OrderItem>();
        foreach (var item in deduplicatedItems)
        {
            var menuItem = menuItems[item.MenuItemId];
            total += menuItem.Price * item.Quantity;
            orderItems.Add(new OrderItem
            {
                MenuItemId = item.MenuItemId,
                Quantity = item.Quantity,
                UnitPrice = menuItem.Price  // snapshot price at time of order
            });
        }

        if (!string.IsNullOrEmpty(request.PaymentIntentId))
        {
            var paid = await _stripe.VerifyPaymentSucceededAsync(request.PaymentIntentId, total);
            if (!paid)
                return ServiceResult<OrderDto>.Fail(OrderServiceError.ValidationFailed,
                    "Payment has not been confirmed. Please complete payment first.");
        }

        var order = new Order
        {
            RestaurantId = request.RestaurantId,
            UserId = userId,
            Status = "Pending",
            TotalAmount = total,
            IdempotencyKey = request.IdempotencyKey,
            DeliveryAddressLine1 = request.DeliveryAddressLine1,
            DeliveryCity = request.DeliveryCity,
            DeliveryPostcode = request.DeliveryPostcode.ToUpperInvariant(),
            CancellableUntil = DateTime.UtcNow.AddMinutes(5),
            StripePaymentIntentId = request.PaymentIntentId ?? "mock_pi_" + Guid.NewGuid().ToString("N")[..16],
            SpecialInstructions = string.IsNullOrWhiteSpace(request.SpecialInstructions) ? null : request.SpecialInstructions.Trim(),
            Items = orderItems
        };

        _db.Orders.Add(order);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_Orders_IdempotencyKey_UserId") == true)
        {
            // Race condition: two concurrent requests with the same idempotency key both
            // passed the pre-check above. The DB unique constraint fired on the second one.
            // Fetch the already-persisted order and return it (idempotent response).
            var raceWinner = await _db.Orders
                .Include(o => o.Items).ThenInclude(i => i.MenuItem)
                .Include(o => o.Restaurant)
                .FirstAsync(o => o.IdempotencyKey == request.IdempotencyKey && o.UserId == userId);
            return ServiceResult<OrderDto>.Ok(MapToDto(raceWinner));
        }

        // Enqueue confirmation email via Hangfire — automatic retries on Resend outage;
        // email failure never blocks or fails the order response.
        var user = await _db.Users.FindAsync(userId);
        if (user != null)
        {
            var address = $"{request.DeliveryAddressLine1}, {request.DeliveryCity}, {request.DeliveryPostcode.ToUpperInvariant()}";
            _jobs.Enqueue<IEmailService>(s =>
                s.SendOrderPlacedAsync(user.Email, user.Username, order.Id,
                    restaurant.Name, total, address));
        }

        return ServiceResult<OrderDto>.Ok(MapToDto(order));
    }

    public async Task<OrderDto?> GetAsync(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Restaurant)
            .FirstOrDefaultAsync(o => o.Id == id);
        return order is null ? null : MapToDto(order);
    }

    public async Task<IEnumerable<OrderDto>> ListForUserAsync(int userId)
    {
        var orders = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Restaurant)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return orders.Select(MapToDto);
    }

    public async Task<PaginatedResult<OrderDto>> ListForUserPagedAsync(int userId, int page, int pageSize)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        page = Math.Max(1, page);

        var query = _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Restaurant)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PaginatedResult<OrderDto>(
            items.Select(MapToDto).ToList(), totalCount, page, pageSize);
    }

    public async Task<IEnumerable<OrderDto>> ListAsync(int? restaurantId, string? status)
    {
        var query = _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Restaurant)
            .AsQueryable();

        if (restaurantId.HasValue)
            query = query.Where(o => o.RestaurantId == restaurantId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(o => o.Status == status);

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return orders.Select(MapToDto);
    }

    public async Task<ServiceResult<object>> AcceptAsync(int id, int restaurantId, AcceptOrderRequest request)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.RestaurantId != restaurantId)
            return ServiceResult<object>.Fail(OrderServiceError.Unauthorized, "Order not found");
        if (order.Status != "Pending")
            return ServiceResult<object>.Fail(OrderServiceError.InvalidTransition, "Order is not pending");

        order.Status = "Accepted";
        order.EstimatedDeliveryTime = DateTime.UtcNow.AddMinutes(request.EstimatedMinutes);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another staff member already acted on this order — reload and report current status
            await _db.Entry(order).ReloadAsync();
            return ServiceResult<object>.Fail(OrderServiceError.InvalidTransition,
                $"Order was already updated to '{order.Status}' by another request");
        }

        var user = await _db.Users.FindAsync(order.UserId);
        var restaurant = await _db.Restaurants.FindAsync(order.RestaurantId);
        if (user != null && restaurant != null)
            _jobs.Enqueue<IEmailService>(s =>
                s.SendOrderAcceptedAsync(user.Email, user.Username, order.Id,
                    restaurant.Name, order.EstimatedDeliveryTime!.Value));

        return ServiceResult<object>.Ok(new { order.Id, order.Status, order.EstimatedDeliveryTime });
    }

    public async Task<ServiceResult<object>> RejectAsync(int id, int restaurantId, RejectOrderRequest request)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.RestaurantId != restaurantId)
            return ServiceResult<object>.Fail(OrderServiceError.Unauthorized, "Order not found");
        if (order.Status != "Pending")
            return ServiceResult<object>.Fail(OrderServiceError.InvalidTransition, "Order is not pending");

        order.Status = "Rejected";
        order.RejectionReason = request.Reason;

        // Persist the rejection BEFORE calling Stripe, mirroring the CancelAsync pattern.
        // Old order: Stripe refunded → SaveChanges threw concurrency exception → order stayed
        // Pending → staff retried → potential double-refund.
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await _db.Entry(order).ReloadAsync();
            return ServiceResult<object>.Fail(OrderServiceError.InvalidTransition,
                $"Order was already updated to '{order.Status}' by another request");
        }

        // Refund after committing — rejection is already durable. If Stripe fails,
        // StripeService logs the error and an admin can issue the refund manually.
        if (!string.IsNullOrEmpty(order.StripePaymentIntentId))
        {
            try { await _stripe.RefundAsync(order.StripePaymentIntentId); }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Stripe refund failed for rejected order {OrderId} — manual refund required", id);
            }
        }

        var user = await _db.Users.FindAsync(order.UserId);
        var restaurant = await _db.Restaurants.FindAsync(order.RestaurantId);
        if (user != null && restaurant != null)
            _jobs.Enqueue<IEmailService>(s =>
                s.SendOrderRejectedAsync(user.Email, user.Username, order.Id,
                    restaurant.Name, request.Reason));

        return ServiceResult<object>.Ok(new { order.Id, order.Status, order.RejectionReason });
    }

    public async Task<ServiceResult<object>> UpdateStatusAsync(int id, int restaurantId, UpdateStatusRequest request)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.RestaurantId != restaurantId)
            return ServiceResult<object>.Fail(OrderServiceError.Unauthorized, "Order not found");

        // Delegate transition rules to OrderStatusMachine (OCP)
        if (!OrderStatusMachine.CanTransition(order.Status, request.Status))
            return ServiceResult<object>.Fail(OrderServiceError.InvalidTransition,
                $"Cannot transition from '{order.Status}' to '{request.Status}'");

        order.Status = request.Status;
        if (request.Status == "Delivered")
            order.DeliveredAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (request.Status == "Delivered")
        {
            var user = await _db.Users.FindAsync(order.UserId);
            var restaurant = await _db.Restaurants.FindAsync(order.RestaurantId);
            if (user != null && restaurant != null)
                _jobs.Enqueue<IEmailService>(s =>
                    s.SendOrderDeliveredAsync(user.Email, user.Username, order.Id, restaurant.Name));
        }

        return ServiceResult<object>.Ok(new { order.Id, order.Status });
    }

    public async Task<ServiceResult<object>> CancelAsync(int id, int userId)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.UserId != userId)
            return ServiceResult<object>.Fail(OrderServiceError.Unauthorized, "Order not found");
        if (order.Status != "Pending")
            return ServiceResult<object>.Fail(OrderServiceError.InvalidTransition, "Order can only be cancelled while pending");
        if (DateTime.UtcNow > order.CancellableUntil)
            return ServiceResult<object>.Fail(OrderServiceError.WindowExpired, "Cancellation window has expired");

        // Race-safe cancel: mark as Cancelling FIRST so no other path can double-act on it,
        // then attempt the Stripe refund, and only commit Cancelled once the refund succeeds.
        order.Status = "Cancelling";
        await _db.SaveChangesAsync(); // Locks out concurrent accept/reject via concurrency token

        if (!string.IsNullOrEmpty(order.StripePaymentIntentId))
        {
            try
            {
                await _stripe.RefundAsync(order.StripePaymentIntentId);
            }
            catch
            {
                // Stripe failed — revert to Pending so customer can retry
                order.Status = "Pending";
                await _db.SaveChangesAsync();
                return ServiceResult<object>.Fail(OrderServiceError.PaymentError,
                    "Refund failed — please try again or contact support");
            }
        }

        order.Status = "Cancelled";
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(order.UserId);
        var restaurant = await _db.Restaurants.FindAsync(order.RestaurantId);
        if (user != null && restaurant != null)
            _jobs.Enqueue<IEmailService>(s =>
                s.SendOrderCancelledAsync(user.Email, user.Username, order.Id, restaurant.Name));

        return ServiceResult<object>.Ok(new { order.Id, order.Status });
    }

    public async Task<ServiceResult<object>> DisputeAsync(int id, int userId, DisputeRequest request)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.UserId != userId)
            return ServiceResult<object>.Fail(OrderServiceError.Unauthorized, "Order not found");
        if (order.Status != "Delivered")
            return ServiceResult<object>.Fail(OrderServiceError.InvalidTransition, "Only delivered orders can be disputed");

        // Enforce a 48-hour dispute window measured from actual delivery time.
        var deliveredAt = order.DeliveredAt ?? order.CreatedAt; // fallback for orders created before this field
        if (DateTime.UtcNow - deliveredAt > TimeSpan.FromHours(48))
            return ServiceResult<object>.Fail(OrderServiceError.WindowExpired,
                "Disputes must be raised within 48 hours of delivery");

        // Guard against concurrent duplicate submissions — frontend checks too but API must be authoritative.
        if (order.DisputeStatus != "None")
            return ServiceResult<object>.Fail(OrderServiceError.ValidationFailed,
                "A dispute has already been raised for this order");

        order.DisputeStatus = "Open";
        order.DisputeNotes = request.Notes;
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(order.UserId);
        var restaurant = await _db.Restaurants.FindAsync(order.RestaurantId);
        if (user != null && restaurant != null)
            _jobs.Enqueue<IEmailService>(s =>
                s.SendDisputeOpenedAsync(user.Email, user.Username, order.Id, restaurant.Name, request.Notes));

        return ServiceResult<object>.Ok(new { order.Id, order.DisputeStatus });
    }

    /// <summary>
    /// Re-places a previous order with the same items and delivery address.
    /// (OCP: extends order placement behaviour without modifying PlaceOrderAsync)
    /// </summary>
    public async Task<ServiceResult<OrderDto>> ReorderAsync(int originalOrderId, int userId, string idempotencyKey)
    {
        var original = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == originalOrderId && o.UserId == userId);

        if (original is null)
            return ServiceResult<OrderDto>.Fail(OrderServiceError.NotFound, "Original order not found");

        var reorderRequest = new PlaceOrderRequest(
            original.RestaurantId,
            original.Items.Where(i => i.MenuItemId.HasValue).Select(i => new OrderItemRequest(i.MenuItemId!.Value, i.Quantity)).ToList(),
            original.DeliveryAddressLine1,
            original.DeliveryCity,
            original.DeliveryPostcode,
            idempotencyKey,
            null,
            null); // SpecialInstructions intentionally blank — customer provides fresh notes each time

        return await PlaceOrderAsync(reorderRequest, userId);
    }

    internal static OrderDto MapToDto(Order o) => new(
        o.Id, o.RestaurantId, o.UserId, o.Status,
        o.RejectionReason, o.DisputeStatus, o.DisputeNotes,
        o.TotalAmount,
        o.DeliveryAddressLine1, o.DeliveryCity, o.DeliveryPostcode,
        o.Restaurant?.Name ?? string.Empty, o.Restaurant?.KitchenVideoUrl, o.Restaurant?.AngelcamCameraId,
        o.EstimatedDeliveryTime,
        o.CancellableUntil, o.CreatedAt, o.DeliveredAt,
        o.SpecialInstructions,
        o.Items.Select(i => new OrderItemDto(i.Id, i.MenuItemId ?? 0,
            i.MenuItem?.Name ?? "(removed)", i.Quantity, i.UnitPrice)).ToList());
}

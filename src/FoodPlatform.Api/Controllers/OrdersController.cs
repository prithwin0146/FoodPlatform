using System.Text.RegularExpressions;
using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Controllers;

[Route("api/orders")]
[Authorize]
public class OrdersController : RestaurantScopedController
{
    private readonly FoodPlatformDbContext _db;
    private static readonly Regex PostcodeRegex = new(@"^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Valid status transitions
    private static readonly Dictionary<string, string> StatusProgression = new()
    {
        ["Pending"] = "Accepted",
        ["Accepted"] = "Preparing",
        ["Preparing"] = "Cooking",
        ["Cooking"] = "Packed",
        ["Packed"] = "OutForDelivery",
        ["OutForDelivery"] = "Delivered"
    };

    public OrdersController(FoodPlatformDbContext db) => _db = db;

    /// <summary>Customer places order (mock payment for Phase 1)</summary>
    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> PlaceOrder(PlaceOrderRequest request)
    {
        // Validate postcode
        if (!PostcodeRegex.IsMatch(request.DeliveryPostcode))
            return BadRequest(new { error = "Invalid UK postcode" });

        // Check restaurant is active
        var restaurant = await _db.Restaurants
            .Include(r => r.Hours)
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId && r.IsActive);
        if (restaurant == null)
            return BadRequest(new { error = "Restaurant not found or inactive" });

        // Check restaurant is currently open
        var now = DateTime.UtcNow;
        var todayHours = restaurant.Hours.FirstOrDefault(h => h.DayOfWeek == (int)now.DayOfWeek);
        if (todayHours == null || todayHours.IsClosed)
            return BadRequest(new { error = "Restaurant is currently closed" });

        var currentTime = now.TimeOfDay;
        if (currentTime < todayHours.OpenTime || currentTime > todayHours.CloseTime)
            return BadRequest(new { error = "Restaurant is currently closed" });

        // Validate items exist and are available, snapshot prices
        var menuItemIds = request.Items.Select(i => i.MenuItemId).ToList();
        var menuItems = await _db.MenuItems
            .Where(m => menuItemIds.Contains(m.Id) && m.RestaurantId == request.RestaurantId && m.IsAvailable)
            .ToDictionaryAsync(m => m.Id);

        if (menuItems.Count != menuItemIds.Distinct().Count())
            return BadRequest(new { error = "One or more items are unavailable" });

        // Calculate total from snapshot prices
        decimal total = 0;
        var orderItems = new List<OrderItem>();
        foreach (var item in request.Items)
        {
            var menuItem = menuItems[item.MenuItemId];
            var lineTotal = menuItem.Price * item.Quantity;
            total += lineTotal;
            orderItems.Add(new OrderItem
            {
                MenuItemId = item.MenuItemId,
                Quantity = item.Quantity,
                UnitPrice = menuItem.Price  // Snapshot price
            });
        }

        // TODO Phase 2: Stripe payment with idempotency key
        // For now, mock payment — just create the order

        var order = new Order
        {
            RestaurantId = request.RestaurantId,
            UserId = CurrentUserId,
            Status = "Pending",
            TotalAmount = total,
            IdempotencyKey = request.IdempotencyKey,
            DeliveryAddressLine1 = request.DeliveryAddressLine1,
            DeliveryCity = request.DeliveryCity,
            DeliveryPostcode = request.DeliveryPostcode,
            CancellableUntil = DateTime.UtcNow.AddMinutes(2),
            StripePaymentIntentId = "mock_pi_" + Guid.NewGuid().ToString("N")[..16],
            Items = orderItems
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        return Ok(MapToDto(order));
    }

    /// <summary>Get single order (customer sees own, staff sees restaurant's)</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();

        // Customer can only see own orders; Staff can see their restaurant's orders
        if (User.IsInRole("Customer") && order.UserId != CurrentUserId)
            return Unauthorized();
        if (User.IsInRole("Staff") && order.RestaurantId != CurrentRestaurantId)
            return Unauthorized();

        return Ok(MapToDto(order));
    }

    /// <summary>Restaurant gets their orders (scoped)</summary>
    [HttpGet]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> List([FromQuery] string? status)
    {
        var query = _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .AsQueryable();

        if (!IsAdmin)
            query = query.Where(o => o.RestaurantId == CurrentRestaurantId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(o => o.Status == status);

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders.Select(MapToDto));
    }

    /// <summary>Restaurant accepts order — sets EstimatedDeliveryTime</summary>
    [HttpPatch("{id:int}/accept")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Accept(int id, AcceptOrderRequest request)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.RestaurantId != CurrentRestaurantId)
            return Unauthorized();
        if (order.Status != "Pending")
            return BadRequest(new { error = "Order is not pending" });

        order.Status = "Accepted";
        order.EstimatedDeliveryTime = DateTime.UtcNow.AddMinutes(request.EstimatedMinutes);
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.Status, order.EstimatedDeliveryTime });
    }

    /// <summary>Restaurant rejects order</summary>
    [HttpPatch("{id:int}/reject")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Reject(int id, RejectOrderRequest request)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.RestaurantId != CurrentRestaurantId)
            return Unauthorized();
        if (order.Status != "Pending")
            return BadRequest(new { error = "Order is not pending" });

        order.Status = "Rejected";
        order.RejectionReason = request.Reason;
        // TODO: Issue Stripe refund
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.Status, order.RejectionReason });
    }

    /// <summary>Restaurant updates order status (enforces progression)</summary>
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateStatusRequest request)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.RestaurantId != CurrentRestaurantId)
            return Unauthorized();

        // Enforce status progression — no skipping
        if (!StatusProgression.TryGetValue(order.Status, out var nextStatus) || nextStatus != request.Status)
            return BadRequest(new { error = $"Cannot transition from '{order.Status}' to '{request.Status}'" });

        order.Status = request.Status;
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.Status });
    }

    /// <summary>Customer cancels order (within 2-minute window)</summary>
    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Cancel(int id)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.UserId != CurrentUserId)
            return Unauthorized();
        if (order.Status != "Pending")
            return BadRequest(new { error = "Order can only be cancelled while pending" });
        if (DateTime.UtcNow > order.CancellableUntil)
            return BadRequest(new { error = "Cancellation window has expired" });

        order.Status = "Cancelled";
        // TODO: Issue Stripe refund
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.Status });
    }

    /// <summary>Customer raises dispute</summary>
    [HttpPost("{id:int}/dispute")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Dispute(int id, DisputeRequest request)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null || order.UserId != CurrentUserId)
            return Unauthorized();

        order.DisputeStatus = "Open";
        order.DisputeNotes = request.Notes;
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.DisputeStatus });
    }

    private static OrderDto MapToDto(Order o) => new(
        o.Id, o.RestaurantId, o.UserId, o.Status,
        o.RejectionReason, o.DisputeStatus, o.DisputeNotes,
        o.TotalAmount, o.DeliveryPostcode, o.EstimatedDeliveryTime,
        o.CancellableUntil, o.CreatedAt,
        o.Items.Select(i => new OrderItemDto(i.Id, i.MenuItemId,
            i.MenuItem?.Name ?? "", i.Quantity, i.UnitPrice)).ToList());
}

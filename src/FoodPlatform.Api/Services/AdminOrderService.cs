using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Admin-only order operations. (SRP: split from restaurant admin concerns)
/// (DIP: depends on IStripeService for refunds, not Stripe.net directly)
/// </summary>
public class AdminOrderService : IAdminOrderService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IStripeService _stripe;
    private readonly IBackgroundJobClient _jobs;

    public AdminOrderService(FoodPlatformDbContext db, IStripeService stripe, IBackgroundJobClient jobs)
    {
        _db = db;
        _stripe = stripe;
        _jobs = jobs;
    }

    public async Task<PaginatedResult<OrderDto>> GetAllAsync(int page, int pageSize, string? status = null, string? search = null)
    {
        // Cap pageSize to prevent runaway queries.
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(o => o.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.Trim().ToLower();
            query = query.Where(o =>
                o.DeliveryAddressLine1.ToLower().Contains(lower) ||
                o.Items.Any(i => i.MenuItem.Name.ToLower().Contains(lower)));
        }

        query = query.OrderByDescending(o => o.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResult<OrderDto>(
            items.Select(OrderService.MapToDto).ToList(),
            totalCount, page, pageSize);
    }

    public async Task<IEnumerable<OrderDto>> GetDisputedAsync()
    {
        var orders = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Where(o => o.DisputeStatus == "Open")
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return orders.Select(OrderService.MapToDto);
    }

    public async Task<object?> RefundAsync(int orderId)
    {
        var order = await _db.Orders.FindAsync(orderId);
        if (order is null) return null;

        if (!string.IsNullOrEmpty(order.StripePaymentIntentId)
            && !order.StripePaymentIntentId.StartsWith("mock_pi_", StringComparison.Ordinal))
        {
            await _stripe.RefundAsync(order.StripePaymentIntentId);
        }

        order.Status = "Cancelled";
        order.DisputeStatus = "Resolved";
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(order.UserId);
        var restaurant = await _db.Restaurants.FindAsync(order.RestaurantId);
        if (user != null && restaurant != null)
            _jobs.Enqueue<IEmailService>(s =>
                s.SendDisputeResolvedAsync(user.Email, user.Username, order.Id, restaurant.Name, true));

        return new { order.Id, order.Status, order.DisputeStatus };
    }

    public async Task<object?> ResolveAsync(int orderId)
    {
        var order = await _db.Orders.FindAsync(orderId);
        if (order is null) return null;

        order.DisputeStatus = "Resolved";
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(order.UserId);
        var restaurant = await _db.Restaurants.FindAsync(order.RestaurantId);
        if (user != null && restaurant != null)
            _jobs.Enqueue<IEmailService>(s =>
                s.SendDisputeResolvedAsync(user.Email, user.Username, order.Id, restaurant.Name, false));

        return new { order.Id, order.DisputeStatus };
    }
}

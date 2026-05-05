using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Admin-only order operations. (SRP: split from restaurant admin concerns)
/// </summary>
public class AdminOrderService : IAdminOrderService
{
    private readonly FoodPlatformDbContext _db;

    public AdminOrderService(FoodPlatformDbContext db) => _db = db;

    public async Task<IEnumerable<OrderDto>> GetAllAsync()
    {
        var orders = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return orders.Select(OrderService.MapToDto);
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

        // TODO Phase 2: Issue actual Stripe refund via PaymentIntentId
        order.Status = "Cancelled";
        order.DisputeStatus = "Resolved";
        await _db.SaveChangesAsync();
        return new { order.Id, order.Status, order.DisputeStatus };
    }
}

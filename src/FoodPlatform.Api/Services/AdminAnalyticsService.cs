using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Computes read-only platform analytics from the database.
/// (SRP: analytics queries only — no order mutation, no restaurant CRUD)
/// (DIP: depends on FoodPlatformDbContext injected via constructor)
/// </summary>
public class AdminAnalyticsService : IAdminAnalyticsService
{
    private readonly FoodPlatformDbContext _db;

    public AdminAnalyticsService(FoodPlatformDbContext db) => _db = db;

    public async Task<AnalyticsDto> GetAsync()
    {
        var totalOrders      = await _db.Orders.CountAsync();
        var activeRestaurants = await _db.Restaurants.CountAsync(r => r.IsActive);
        var totalRevenue     = await _db.Orders
            .Where(o => o.Status != "Cancelled" && o.Status != "Rejected")
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;
        var avgOrderValue    = totalOrders > 0 ? totalRevenue / totalOrders : 0m;

        var ordersByStatus = await _db.Orders
            .GroupBy(o => o.Status)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count);

        var topRestaurants = await _db.Orders
            .Where(o => o.Status != "Cancelled" && o.Status != "Rejected")
            .GroupBy(o => new { o.RestaurantId, o.Restaurant!.Name })
            .Select(g => new TopRestaurantDto(
                g.Key.RestaurantId,
                g.Key.Name,
                g.Sum(o => (decimal)o.TotalAmount),
                g.Count()))
            .OrderByDescending(t => t.Revenue)
            .Take(10)
            .ToListAsync();

        return new AnalyticsDto(
            totalOrders,
            activeRestaurants,
            Math.Round(totalRevenue, 2),
            Math.Round(avgOrderValue, 2),
            ordersByStatus,
            topRestaurants);
    }
}

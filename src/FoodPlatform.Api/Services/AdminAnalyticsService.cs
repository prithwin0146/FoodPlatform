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
            .GroupBy(o => o.RestaurantId)
            .Select(g => new { RestaurantId = g.Key, Revenue = g.Sum(o => o.TotalAmount), OrderCount = g.Count() })
            .ToListAsync();

        var restaurantIds = topRestaurants.Select(g => g.RestaurantId).ToList();
        var restaurantNames = await _db.Restaurants
            .Where(r => restaurantIds.Contains(r.Id))
            .Select(r => new { r.Id, r.Name })
            .ToDictionaryAsync(r => r.Id, r => r.Name);

        var topRestaurantDtos = topRestaurants
            .Select(g => new TopRestaurantDto(
                g.RestaurantId,
                restaurantNames.GetValueOrDefault(g.RestaurantId, "Unknown"),
                g.Revenue,
                g.OrderCount))
            .OrderByDescending(t => t.Revenue)
            .Take(10)
            .ToList();

        return new AnalyticsDto(
            totalOrders,
            activeRestaurants,
            Math.Round(totalRevenue, 2),
            Math.Round(avgOrderValue, 2),
            ordersByStatus,
            topRestaurantDtos);
    }
}

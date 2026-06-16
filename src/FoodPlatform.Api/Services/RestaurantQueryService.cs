using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using FoodPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Read-only queries for the public restaurants API.
/// (SRP: query concern only — no mutations; see IAdminRestaurantService for admin mutations)
/// </summary>
public class RestaurantQueryService : IRestaurantQueryService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IMemoryCacheService _cache;

    public RestaurantQueryService(FoodPlatformDbContext db, IMemoryCacheService cache)
{
    _db = db;
    _cache = cache;
}

    public async Task<IEnumerable<RestaurantDto>> ListActiveAsync(string? postcode = null)
    {
        // TODO Phase 2: filter by delivery radius using postcode
        // Cache key for active restaurants list (postcode filtering to be added in Phase 2)
        string cacheKey = "active-restaurants-list";

        return await _cache.GetOrCreate(cacheKey, entry =>
        {
            // Set cache expiration to 1 hour for semi-static restaurant data
            entry.SetAbsoluteExpiration(TimeSpan.FromHours(1));

            return _db.Restaurants
                .AsNoTracking()
                .Where(r => r.IsActive)
                .Select(r => new RestaurantDto(r.Id, r.Name, r.Address, r.BasePostcode,
                                r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl,
                                r.CuisineType, r.EstimatedDeliveryMinutes, r.AngelcamCameraId, r.Phone, r.SupportsCollection))
                .ToListAsync();
        });
    }

    public async Task<RestaurantDetailDto?> GetDetailAsync(int id)
    {
        var key = $"restaurant-detail-{id}";
        return await _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
            var r = await _db.Restaurants
                .Include(r => r.Hours)
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

            if (r is null) return null;

            var now = DateTime.UtcNow;
            var activePromotions = await _db.RestaurantPromotions
                .Include(p => p.AppliesToCategory)
                .Where(p => p.RestaurantId == id && p.IsActive
                    && (p.StartsAt == null || p.StartsAt <= now)
                    && (p.EndsAt == null || p.EndsAt >= now))
                .Select(p => new RestaurantPromotionDto(p.Id, p.RestaurantId, p.Title, p.Description,
                    p.DiscountType, p.DiscountValue, p.AppliesToCategoryId,
                    p.AppliesToCategory != null ? p.AppliesToCategory.Name : null,
                    p.StartsAt, p.EndsAt, p.IsActive, p.CreatedAt))
                .ToListAsync();

            return new RestaurantDetailDto(r.Id, r.Name, r.Address, r.BasePostcode,
                r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl,
                r.CuisineType, r.EstimatedDeliveryMinutes,
                r.Hours.Select(h => new RestaurantHoursDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed)).ToList(),
                r.AngelcamCameraId, r.Phone, r.SupportsCollection, activePromotions);
        })!;
    }

    public async Task<IEnumerable<RestaurantHoursDto>> GetHoursAsync(int id)
    {
        var key = $"restaurant-hours-{id}";
        return await _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.SetAbsoluteExpiration(TimeSpan.FromHours(1));
            return await _db.RestaurantHours
                .Where(h => h.RestaurantId == id)
                .Select(h => new RestaurantHoursDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed))
                .ToListAsync();
        })!;
    }

    public async Task<IEnumerable<MenuCategoryDto>> GetMenuAsync(int id)
    {
        var cats = await _db.MenuCategories
            .Include(c => c.Items)
            .Where(c => c.RestaurantId == id)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return cats.Select(c => new MenuCategoryDto(
            c.Id, c.Name, c.SortOrder,
            c.Items.Where(i => i.IsAvailable)
                   .Select(i => new MenuItemDto(i.Id, i.CategoryId, i.Name, i.Description,
                       i.Price,
                       Infrastructure.JsonStringList.Parse(i.Allergens),
                       Infrastructure.JsonStringList.Parse(i.DietaryTags),
                       i.IsAvailable, i.ImageUrl, i.TrackStock, i.StockCount))
                   .ToList()));
    }
}

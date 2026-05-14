using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Read-only queries for the public restaurants API.
/// (SRP: query concern only — no mutations; see IAdminRestaurantService for admin mutations)
/// </summary>
public class RestaurantQueryService : IRestaurantQueryService
{
    private readonly FoodPlatformDbContext _db;

    public RestaurantQueryService(FoodPlatformDbContext db) => _db = db;

    public async Task<IEnumerable<RestaurantDto>> ListActiveAsync(string? postcode = null)
    {
        // TODO Phase 2: filter by delivery radius using postcode
        return await _db.Restaurants
            .Where(r => r.IsActive)
            .Select(r => new RestaurantDto(r.Id, r.Name, r.Address, r.BasePostcode,
                            r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl,
                            r.CuisineType, r.EstimatedDeliveryMinutes))
            .ToListAsync();
    }

    public async Task<RestaurantDetailDto?> GetDetailAsync(int id)
    {
        var r = await _db.Restaurants
            .Include(r => r.Hours)
            .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

        if (r is null) return null;

        return new RestaurantDetailDto(r.Id, r.Name, r.Address, r.BasePostcode,
            r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl,
            r.CuisineType, r.EstimatedDeliveryMinutes,
            r.Hours.Select(h => new RestaurantHoursDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed)).ToList());
    }

    public async Task<IEnumerable<RestaurantHoursDto>> GetHoursAsync(int id)
    {
        return await _db.RestaurantHours
            .Where(h => h.RestaurantId == id)
            .Select(h => new RestaurantHoursDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed))
            .ToListAsync();
    }

    public async Task<IEnumerable<MenuCategoryDto>> GetMenuAsync(int id)
    {
        return await _db.MenuCategories
            .Include(c => c.Items)
            .Where(c => c.RestaurantId == id)
            .OrderBy(c => c.SortOrder)
            .Select(c => new MenuCategoryDto(
                c.Id, c.Name, c.SortOrder,
                c.Items.Where(i => i.IsAvailable)
                       .Select(i => new MenuItemDto(i.Id, i.CategoryId, i.Name, i.Description,
                           i.Price, i.Allergens, i.DietaryTags, i.IsAvailable, i.ImageUrl))
                       .ToList()))
            .ToListAsync();
    }
}

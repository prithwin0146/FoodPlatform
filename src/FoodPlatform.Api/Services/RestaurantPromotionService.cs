using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Infrastructure;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Restaurant-level promotions: CRUD for staff and read-only for customers.
/// (SRP: promotion concern only — no order or cart logic here)
/// </summary>
public class RestaurantPromotionService : IRestaurantPromotionService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IMemoryCacheService _cache;

    public RestaurantPromotionService(FoodPlatformDbContext db, IMemoryCacheService cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<IEnumerable<RestaurantPromotionDto>> GetActiveForRestaurantAsync(int restaurantId)
    {
        var key = $"restaurant-promotions-active-{restaurantId}";
        return await _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(15));
            var now = DateTime.UtcNow;
            return await _db.RestaurantPromotions
                .Include(p => p.AppliesToCategory)
                .Where(p => p.RestaurantId == restaurantId && p.IsActive
                    && (p.StartsAt == null || p.StartsAt <= now)
                    && (p.EndsAt == null || p.EndsAt >= now))
                .OrderBy(p => p.CreatedAt)
                .Select(p => ToDto(p))
                .ToListAsync();
        })!;
    }

    public async Task<IEnumerable<RestaurantPromotionDto>> GetAllForRestaurantAsync(int restaurantId) =>
        await _db.RestaurantPromotions
            .Include(p => p.AppliesToCategory)
            .Where(p => p.RestaurantId == restaurantId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToDto(p))
            .ToListAsync();

    public async Task<RestaurantPromotionDto> CreateAsync(int restaurantId, CreateRestaurantPromotionRequest request)
    {
        var promotion = new RestaurantPromotion
        {
            RestaurantId = restaurantId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            AppliesToCategoryId = request.AppliesToCategoryId,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
        };
        _db.RestaurantPromotions.Add(promotion);
        await _db.SaveChangesAsync();
        _cache.Remove($"restaurant-promotions-active-{restaurantId}");
        return ToDto(promotion);
    }

    public async Task<RestaurantPromotionDto?> UpdateAsync(int id, int restaurantId, UpdateRestaurantPromotionRequest request)
    {
        var promotion = await _db.RestaurantPromotions
            .Include(p => p.AppliesToCategory)
            .FirstOrDefaultAsync(p => p.Id == id && p.RestaurantId == restaurantId);
        if (promotion is null) return null;

        if (request.Title is not null) promotion.Title = request.Title.Trim();
        if (request.Description is not null) promotion.Description = request.Description.Trim();
        if (request.DiscountValue.HasValue) promotion.DiscountValue = request.DiscountValue.Value;
        if (request.AppliesToCategoryId.HasValue) promotion.AppliesToCategoryId = request.AppliesToCategoryId.Value;
        if (request.StartsAt.HasValue) promotion.StartsAt = request.StartsAt.Value;
        if (request.EndsAt.HasValue) promotion.EndsAt = request.EndsAt.Value;
        if (request.IsActive.HasValue) promotion.IsActive = request.IsActive.Value;

        await _db.SaveChangesAsync();
        _cache.Remove($"restaurant-promotions-active-{restaurantId}");
        return ToDto(promotion);
    }

    public async Task<bool> DeleteAsync(int id, int restaurantId)
    {
        var promotion = await _db.RestaurantPromotions
            .FirstOrDefaultAsync(p => p.Id == id && p.RestaurantId == restaurantId);
        if (promotion is null) return false;
        _db.RestaurantPromotions.Remove(promotion);
        await _db.SaveChangesAsync();
        _cache.Remove($"restaurant-promotions-active-{restaurantId}");
        return true;
    }

    private static RestaurantPromotionDto ToDto(RestaurantPromotion p) => new(
        p.Id, p.RestaurantId, p.Title, p.Description, p.DiscountType, p.DiscountValue,
        p.AppliesToCategoryId, p.AppliesToCategory?.Name, p.StartsAt, p.EndsAt, p.IsActive, p.CreatedAt);
}

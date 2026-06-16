using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Infrastructure;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Manages saved / favourited restaurants for customers.
/// (SRP: favouriting logic only — no order or menu concerns)
/// (DIP: depends on FoodPlatformDbContext via ctor injection)
/// </summary>
public class FavouritesService : IFavouritesService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IMemoryCacheService _cache;

    public FavouritesService(FoodPlatformDbContext db, IMemoryCacheService cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<IEnumerable<RestaurantDto>> GetFavouritesAsync(int userId)
    {
        return await _cache.GetOrCreateAsync($"favourites-{userId}",
            async entry =>
            {
                entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(2));
                return await _db.FavouriteRestaurants
                    .Where(f => f.UserId == userId)
                    .Select(f => new RestaurantDto(
                        f.Restaurant.Id,
                        f.Restaurant.Name,
                        f.Restaurant.Address,
                        f.Restaurant.BasePostcode,
                        f.Restaurant.DeliveryRadiusMiles,
                        f.Restaurant.HygieneRating,
                        f.Restaurant.IsActive,
                        f.Restaurant.ImageUrl,
                        f.Restaurant.KitchenVideoUrl,
                        f.Restaurant.CuisineType,
                        f.Restaurant.EstimatedDeliveryMinutes,
                        f.Restaurant.AngelcamCameraId,
                        f.Restaurant.Phone,
                        f.Restaurant.SupportsCollection))
                    .ToListAsync();
            });
    }

    public async Task<bool> AddFavouriteAsync(int userId, int restaurantId)
    {
        var exists = await _db.FavouriteRestaurants
            .AnyAsync(f => f.UserId == userId && f.RestaurantId == restaurantId);
        if (exists) return false;

        _db.FavouriteRestaurants.Add(new FavouriteRestaurant
        {
            UserId = userId,
            RestaurantId = restaurantId,
        });
        await _db.SaveChangesAsync();
        _cache.Remove($"favourites-{userId}");
        return true;
    }

    public async Task<bool> RemoveFavouriteAsync(int userId, int restaurantId)
    {
        var fav = await _db.FavouriteRestaurants
            .FirstOrDefaultAsync(f => f.UserId == userId && f.RestaurantId == restaurantId);
        if (fav is null) return false;

        _db.FavouriteRestaurants.Remove(fav);
        await _db.SaveChangesAsync();
        _cache.Remove($"favourites-{userId}");
        return true;
    }
}

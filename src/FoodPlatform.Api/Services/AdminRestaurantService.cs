using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Admin-only restaurant operations. (SRP: split from order admin concerns)
/// </summary>
public class AdminRestaurantService : IAdminRestaurantService
{
    private readonly FoodPlatformDbContext _db;

    public AdminRestaurantService(FoodPlatformDbContext db) => _db = db;

    public async Task<IEnumerable<RestaurantDto>> GetAllAsync()
    {
        return await _db.Restaurants
            .Select(r => new RestaurantDto(r.Id, r.Name, r.Address, r.BasePostcode,
                            r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl,
                            r.CuisineType, r.EstimatedDeliveryMinutes, r.LiveStreamPlaybackId))
            .ToListAsync();
    }

    public async Task<RestaurantDto> CreateAsync(CreateRestaurantRequest request)
    {
        var restaurant = new Restaurant
        {
            Name = request.Name,
            Address = request.Address,
            BasePostcode = request.BasePostcode,
            DeliveryRadiusMiles = request.DeliveryRadiusMiles,
            HygieneRating = request.HygieneRating,
            ImageUrl = request.ImageUrl,
            CuisineType = request.CuisineType ?? "Other",
            EstimatedDeliveryMinutes = request.EstimatedDeliveryMinutes ?? 30
        };
        _db.Restaurants.Add(restaurant);
        await _db.SaveChangesAsync();
        return ToDto(restaurant);
    }

    public async Task<RestaurantDto?> UpdateAsync(int id, UpdateRestaurantRequest request)
    {
        var restaurant = await _db.Restaurants.FindAsync(id);
        if (restaurant is null) return null;

        if (request.Name != null) restaurant.Name = request.Name;
        if (request.Address != null) restaurant.Address = request.Address;
        if (request.BasePostcode != null) restaurant.BasePostcode = request.BasePostcode;
        if (request.DeliveryRadiusMiles.HasValue) restaurant.DeliveryRadiusMiles = request.DeliveryRadiusMiles.Value;
        if (request.HygieneRating.HasValue) restaurant.HygieneRating = request.HygieneRating.Value;
        if (request.ImageUrl != null) restaurant.ImageUrl = request.ImageUrl;
        // null means "no change"; empty string means "clear the URL"
        if (request.KitchenVideoUrl != null) restaurant.KitchenVideoUrl = request.KitchenVideoUrl == "" ? null : request.KitchenVideoUrl;
        if (request.CuisineType != null) restaurant.CuisineType = request.CuisineType;
        if (request.EstimatedDeliveryMinutes.HasValue) restaurant.EstimatedDeliveryMinutes = request.EstimatedDeliveryMinutes.Value;

        await _db.SaveChangesAsync();
        return ToDto(restaurant);
    }

    public async Task<object?> ToggleActiveAsync(int id)
    {
        var restaurant = await _db.Restaurants.FindAsync(id);
        if (restaurant is null) return null;

        restaurant.IsActive = !restaurant.IsActive;
        await _db.SaveChangesAsync();
        return new { restaurant.Id, restaurant.IsActive };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var restaurant = await _db.Restaurants.FindAsync(id);
        if (restaurant is null) return false;
        _db.Restaurants.Remove(restaurant);
        await _db.SaveChangesAsync();
        return true;
    }

    private static RestaurantDto ToDto(Restaurant r) =>
        new(r.Id, r.Name, r.Address, r.BasePostcode, r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl, r.CuisineType, r.EstimatedDeliveryMinutes, r.LiveStreamPlaybackId);
}

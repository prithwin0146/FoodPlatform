using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Admin-only restaurant operations. (SRP: split from order admin concerns)
/// (DIP: depends on IPasswordHasher abstraction for staff account creation)
/// </summary>
public class AdminRestaurantService : IAdminRestaurantService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IPasswordHasher _hasher;

    public AdminRestaurantService(FoodPlatformDbContext db, IPasswordHasher hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    public async Task<IEnumerable<RestaurantDto>> GetAllAsync()
    {
        return await _db.Restaurants
            .Select(r => new RestaurantDto(r.Id, r.Name, r.Address, r.BasePostcode,
                            r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl,
                            r.CuisineType, r.EstimatedDeliveryMinutes, r.AngelcamCameraId))
            .ToListAsync();
    }

    public async Task<CreateRestaurantResponse> CreateAsync(CreateRestaurantRequest request)
    {
        // Check email uniqueness before starting the transaction
        if (await _db.Users.AnyAsync(u => u.Email == request.StaffEmail))
            throw new InvalidOperationException($"A user with email '{request.StaffEmail}' already exists.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        var restaurant = new Restaurant
        {
            Name = request.Name,
            Address = request.Address,
            BasePostcode = request.BasePostcode,
            DeliveryRadiusMiles = request.DeliveryRadiusMiles,
            HygieneRating = request.HygieneRating,
            ImageUrl = request.ImageUrl,
            CuisineType = request.CuisineType ?? "Other",
            EstimatedDeliveryMinutes = request.EstimatedDeliveryMinutes ?? 30,
            Phone = request.Phone
        };
        _db.Restaurants.Add(restaurant);
        await _db.SaveChangesAsync(); // get restaurant.Id

        var staffUser = new User
        {
            RestaurantId = restaurant.Id,
            Role = "Staff",
            Username = request.StaffName,
            Email = request.StaffEmail,
            PasswordHash = _hasher.Hash(request.StaffPassword),
            IsEmailVerified = true, // Admin-created accounts skip email verification
        };
        _db.Users.Add(staffUser);
        await _db.SaveChangesAsync();

        await tx.CommitAsync();

        return new CreateRestaurantResponse(
            ToDto(restaurant),
            staffUser.Id,
            staffUser.Email,
            staffUser.Username);
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
        if (request.Phone != null) restaurant.Phone = request.Phone == "" ? null : request.Phone;

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
        new(r.Id, r.Name, r.Address, r.BasePostcode, r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl, r.CuisineType, r.EstimatedDeliveryMinutes, r.AngelcamCameraId);
}

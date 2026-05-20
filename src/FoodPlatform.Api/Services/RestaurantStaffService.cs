using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Staff-facing operations on their own restaurant.
/// (SRP: only owns staff-scoped restaurant mutations — admin CRUD lives in AdminRestaurantService)
/// (DIP: controllers inject IRestaurantStaffService, not this concrete class)
/// </summary>
public class RestaurantStaffService : IRestaurantStaffService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IAngelcamService _angelcam;

    public RestaurantStaffService(FoodPlatformDbContext db, IAngelcamService angelcam)
    {
        _db = db;
        _angelcam = angelcam;
    }

    public async Task<RestaurantDto?> GetMyRestaurantAsync(int restaurantId)
    {
        var r = await _db.Restaurants.FindAsync(restaurantId);
        return r is null ? null : ToDto(r);
    }

    public async Task<ServiceResult<RestaurantDto>> UpdateKitchenVideoAsync(int restaurantId, string? videoUrl)
    {
        var restaurant = await _db.Restaurants.FindAsync(restaurantId);
        if (restaurant is null)
            return ServiceResult<RestaurantDto>.Fail(OrderServiceError.NotFound, "Restaurant not found");

        // Normalise: empty string clears the video
        restaurant.KitchenVideoUrl = string.IsNullOrWhiteSpace(videoUrl) ? null : videoUrl.Trim();
        await _db.SaveChangesAsync();

        return ServiceResult<RestaurantDto>.Ok(ToDto(restaurant));
    }

    public async Task<ServiceResult<RestaurantDto>> SetActiveAsync(int restaurantId, bool isActive)
    {
        var restaurant = await _db.Restaurants.FindAsync(restaurantId);
        if (restaurant is null)
            return ServiceResult<RestaurantDto>.Fail(OrderServiceError.NotFound, "Restaurant not found");

        restaurant.IsActive = isActive;
        await _db.SaveChangesAsync();

        return ServiceResult<RestaurantDto>.Ok(ToDto(restaurant));
    }

    public async Task<ServiceResult<RestaurantDto>> UpdateLiveStreamAsync(int restaurantId, string? playbackId)
    {
        var restaurant = await _db.Restaurants.FindAsync(restaurantId);
        if (restaurant is null)
            return ServiceResult<RestaurantDto>.Fail(OrderServiceError.NotFound, "Restaurant not found");

        // Evict stale cached HLS URL so the next customer request fetches a fresh one.
        // Covers: camera removed, same ID re-configured after a token rotation.
        if (!string.IsNullOrWhiteSpace(restaurant.AngelcamCameraId))
            _angelcam.InvalidateCache(restaurant.AngelcamCameraId);

        restaurant.AngelcamCameraId = string.IsNullOrWhiteSpace(playbackId) ? null : playbackId.Trim();
        await _db.SaveChangesAsync();

        return ServiceResult<RestaurantDto>.Ok(ToDto(restaurant));
    }

    private static RestaurantDto ToDto(Data.Entities.Restaurant r) =>
        new(r.Id, r.Name, r.Address, r.BasePostcode,
            r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive, r.ImageUrl, r.KitchenVideoUrl,
            r.CuisineType, r.EstimatedDeliveryMinutes, r.AngelcamCameraId);

    public async Task<ServiceResult<IEnumerable<RestaurantHoursDto>>> UpdateHoursAsync(
        int restaurantId, UpdateHoursRequest request)
    {
        var existing = await _db.RestaurantHours
            .Where(h => h.RestaurantId == restaurantId)
            .ToListAsync();

        // Upsert each day in the request
        foreach (var dto in request.Hours)
        {
            var row = existing.FirstOrDefault(h => h.DayOfWeek == dto.DayOfWeek);
            if (row is null)
            {
                row = new Data.Entities.RestaurantHours { RestaurantId = restaurantId };
                _db.RestaurantHours.Add(row);
            }
            row.DayOfWeek = dto.DayOfWeek;
            row.OpenTime   = dto.OpenTime;
            row.CloseTime  = dto.CloseTime;
            row.IsClosed   = dto.IsClosed;
        }

        await _db.SaveChangesAsync();

        var updated = await _db.RestaurantHours
            .Where(h => h.RestaurantId == restaurantId)
            .OrderBy(h => h.DayOfWeek)
            .Select(h => new RestaurantHoursDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed))
            .ToListAsync();

        return ServiceResult<IEnumerable<RestaurantHoursDto>>.Ok(updated);
    }
}

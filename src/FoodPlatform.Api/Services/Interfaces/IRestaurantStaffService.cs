using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Operations a restaurant staff member can perform on their own restaurant's profile.
/// (SRP: separated from admin mutations and public queries)
/// (ISP: only the methods staff need — no admin-only CRUD)
/// </summary>
public interface IRestaurantStaffService
{
    /// <summary>
    /// Returns the full profile of the restaurant this staff member belongs to.
    /// </summary>
    Task<RestaurantDto?> GetMyRestaurantAsync(int restaurantId);

    /// <summary>
    /// Updates the kitchen video URL for the staff member's restaurant.
    /// Accepts a YouTube embed URL, Vimeo URL, or direct MP4 link.
    /// Pass null or empty string to clear the current video.
    /// </summary>
    Task<ServiceResult<RestaurantDto>> UpdateKitchenVideoAsync(int restaurantId, string? videoUrl);

    /// <summary>
    /// Sets the restaurant's open/closed status.
    /// (OCP: new staff capability added without changing existing methods)
    /// </summary>
    Task<ServiceResult<RestaurantDto>> SetActiveAsync(int restaurantId, bool isActive);

    /// <summary>
    /// Sets or clears the Angelcam Camera ID for this restaurant.
    /// Pass null or empty string to stop streaming.
    /// </summary>
    Task<ServiceResult<RestaurantDto>> UpdateLiveStreamAsync(int restaurantId, string? playbackId);

    /// <summary>
    /// Replaces the restaurant's weekly opening hours (upsert per day-of-week).
    /// (OCP: adding a new staff capability without modifying the existing methods)
    /// </summary>
    Task<ServiceResult<IEnumerable<RestaurantHoursDto>>> UpdateHoursAsync(int restaurantId, UpdateHoursRequest request);
}

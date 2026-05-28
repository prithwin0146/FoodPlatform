using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: restaurant DTOs isolated — changes don't force recompilation of order/menu DTOs)
public record RestaurantDto(int Id, string Name, string Address, string BasePostcode,
    double DeliveryRadiusMiles, int HygieneRating, bool IsActive, string? ImageUrl, string? KitchenVideoUrl,
    string CuisineType, int EstimatedDeliveryMinutes, string? AngelcamCameraId = null)
{
    /// <summary>Opaque hash of the integer Id — use this in URLs, never the raw int.</summary>
    public string HashId { get; init; } = string.Empty;
}

public record RestaurantDetailDto(int Id, string Name, string Address, string BasePostcode,
    double DeliveryRadiusMiles, int HygieneRating, bool IsActive, string? ImageUrl, string? KitchenVideoUrl,
    string CuisineType, int EstimatedDeliveryMinutes, List<RestaurantHoursDto> Hours, string? AngelcamCameraId = null)
{
    /// <summary>Opaque hash of the integer Id — use this in URLs, never the raw int.</summary>
    public string HashId { get; init; } = string.Empty;
}

public record RestaurantHoursDto(int DayOfWeek, TimeSpan OpenTime, TimeSpan CloseTime, bool IsClosed);

public record CreateRestaurantRequest(
    [Required, MaxLength(200)] string Name,
    [Required, MaxLength(500)] string Address,
    [Required] string BasePostcode,
    [Range(0.1, 50.0, ErrorMessage = "Delivery radius must be between 0.1 and 50 miles")]
    double DeliveryRadiusMiles,
    [Range(0, 5, ErrorMessage = "Hygiene rating must be between 0 and 5")]
    int HygieneRating,
    [MaxLength(500)] string? ImageUrl,
    [MaxLength(1000)] string? KitchenVideoUrl,
    [MaxLength(100)] string? CuisineType,
    int? EstimatedDeliveryMinutes,
    [MaxLength(30)] string? Phone,
    /// <summary>Display name for the staff account (e.g. "Spice Garden Staff").</summary>
    [Required, MaxLength(100)] string StaffName,
    /// <summary>Login email for the staff account.</summary>
    [Required, EmailAddress, MaxLength(200)] string StaffEmail,
    /// <summary>Initial password for the staff account (min 8 chars).</summary>
    [Required, MinLength(8, ErrorMessage = "Password must be at least 8 characters."), MaxLength(100)] string StaffPassword);

/// <summary>Returned after creating a restaurant — includes the staff credentials for the admin to note down.</summary>
public record CreateRestaurantResponse(
    RestaurantDto Restaurant,
    int StaffUserId,
    string StaffEmail,
    string StaffName);

public record UpdateHoursRequest(List<RestaurantHoursDto> Hours);

public record UpdateRestaurantRequest(
    [MaxLength(200)] string? Name,
    [MaxLength(500)] string? Address,
    string? BasePostcode,
    [Range(0.1, 50.0, ErrorMessage = "Delivery radius must be between 0.1 and 50 miles")]
    double? DeliveryRadiusMiles,
    [Range(0, 5, ErrorMessage = "Hygiene rating must be between 0 and 5")]
    int? HygieneRating,
    [MaxLength(500)] string? ImageUrl,
    [MaxLength(1000)] string? KitchenVideoUrl,
    [MaxLength(100)] string? CuisineType,
    int? EstimatedDeliveryMinutes,
    [MaxLength(30)] string? Phone = null);

/// <summary>Staff-only request to update the kitchen video URL for their restaurant.</summary>
public record UpdateKitchenVideoRequest([MaxLength(1000)] string? KitchenVideoUrl);

/// <summary>Staff-only request to toggle the restaurant open/closed status.</summary>
public record SetActiveRequest([Required] bool IsActive);

/// <summary>Staff-only request to set or clear the Mux live stream playback ID for their restaurant.</summary>
public record UpdateLiveStreamRequest([MaxLength(200)] string? PlaybackId);

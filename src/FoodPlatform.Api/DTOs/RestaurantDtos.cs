using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: restaurant DTOs isolated — changes don't force recompilation of order/menu DTOs)
public record RestaurantDto(int Id, string Name, string Address, string BasePostcode,
    double DeliveryRadiusMiles, int HygieneRating, bool IsActive, string? ImageUrl, string? KitchenVideoUrl);

public record RestaurantDetailDto(int Id, string Name, string Address, string BasePostcode,
    double DeliveryRadiusMiles, int HygieneRating, bool IsActive, string? ImageUrl, string? KitchenVideoUrl, List<RestaurantHoursDto> Hours);

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
    [MaxLength(1000)] string? KitchenVideoUrl);

public record UpdateRestaurantRequest(
    [MaxLength(200)] string? Name,
    [MaxLength(500)] string? Address,
    string? BasePostcode,
    [Range(0.1, 50.0, ErrorMessage = "Delivery radius must be between 0.1 and 50 miles")]
    double? DeliveryRadiusMiles,
    [Range(0, 5, ErrorMessage = "Hygiene rating must be between 0 and 5")]
    int? HygieneRating,
    [MaxLength(500)] string? ImageUrl,
    [MaxLength(1000)] string? KitchenVideoUrl);

/// <summary>Staff-only request to update the kitchen video URL for their restaurant.</summary>
public record UpdateKitchenVideoRequest([MaxLength(1000)] string? KitchenVideoUrl);

/// <summary>Staff-only request to toggle the restaurant open/closed status.</summary>
public record SetActiveRequest([Required] bool IsActive);

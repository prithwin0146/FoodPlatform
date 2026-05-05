using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: restaurant DTOs isolated — changes don't force recompilation of order/menu DTOs)
public record RestaurantDto(int Id, string Name, string Address, string BasePostcode,
    double DeliveryRadiusMiles, int HygieneRating, bool IsActive, string? ImageUrl);

public record RestaurantDetailDto(int Id, string Name, string Address, string BasePostcode,
    double DeliveryRadiusMiles, int HygieneRating, bool IsActive, string? ImageUrl, List<RestaurantHoursDto> Hours);

public record RestaurantHoursDto(int DayOfWeek, TimeSpan OpenTime, TimeSpan CloseTime, bool IsClosed);

public record CreateRestaurantRequest(
    [Required] string Name, [Required] string Address,
    [Required] string BasePostcode, double DeliveryRadiusMiles, int HygieneRating,
    string? ImageUrl);

public record UpdateRestaurantRequest(string? Name, string? Address,
    string? BasePostcode, double? DeliveryRadiusMiles, int? HygieneRating, string? ImageUrl);

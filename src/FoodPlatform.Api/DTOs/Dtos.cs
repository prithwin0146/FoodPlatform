using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// === Auth ===
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

public record AuthResponse(string Token, string Role, int UserId, int? RestaurantId);

// === Restaurant ===
public record RestaurantDto(int Id, string Name, string Address, string BasePostcode,
    double DeliveryRadiusMiles, int HygieneRating, bool IsActive);

public record RestaurantDetailDto(int Id, string Name, string Address, string BasePostcode,
    double DeliveryRadiusMiles, int HygieneRating, bool IsActive, List<RestaurantHoursDto> Hours);

public record RestaurantHoursDto(int DayOfWeek, TimeSpan OpenTime, TimeSpan CloseTime, bool IsClosed);

public record CreateRestaurantRequest(
    [Required] string Name, [Required] string Address,
    [Required] string BasePostcode, double DeliveryRadiusMiles, int HygieneRating);

public record UpdateRestaurantRequest(string? Name, string? Address,
    string? BasePostcode, double? DeliveryRadiusMiles, int? HygieneRating);

// === Menu ===
public record MenuCategoryDto(int Id, string Name, int SortOrder, List<MenuItemDto> Items);

public record MenuItemDto(int Id, int CategoryId, string Name, string? Description,
    decimal Price, string? Allergens, string? DietaryTags, bool IsAvailable);

public record CreateMenuItemRequest(
    [Required] int CategoryId, [Required] string Name, string? Description,
    [Required] decimal Price, string? Allergens, string? DietaryTags);

public record UpdateMenuItemRequest(int? CategoryId, string? Name, string? Description,
    decimal? Price, string? Allergens, string? DietaryTags);

public record CreateCategoryRequest([Required] string Name, int SortOrder);

// === Order ===
public record PlaceOrderRequest(
    [Required] int RestaurantId,
    [Required] List<OrderItemRequest> Items,
    [Required] string DeliveryAddressLine1,
    [Required] string DeliveryCity,
    [Required] string DeliveryPostcode,
    [Required] string IdempotencyKey,
    string? PaymentMethodId);

public record OrderItemRequest(int MenuItemId, int Quantity);

public record OrderDto(int Id, int RestaurantId, int UserId, string Status,
    string? RejectionReason, string DisputeStatus, string? DisputeNotes,
    decimal TotalAmount, string DeliveryPostcode, DateTime? EstimatedDeliveryTime,
    DateTime CancellableUntil, DateTime CreatedAt, List<OrderItemDto> Items);

public record OrderItemDto(int Id, int MenuItemId, string MenuItemName, int Quantity, decimal UnitPrice);

public record AcceptOrderRequest([Required] int EstimatedMinutes);  // 20/30/45/60

public record RejectOrderRequest([Required] string Reason);

public record UpdateStatusRequest([Required] string Status);

public record DisputeRequest([Required] string Notes);

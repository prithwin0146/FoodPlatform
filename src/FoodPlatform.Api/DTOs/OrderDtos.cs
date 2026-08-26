using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

/// <summary>
/// Generic pagination envelope for unbounded list endpoints.
/// (SRP: pagination shape owned here; callers don't need to build their own)
/// </summary>
public record PaginatedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
}

// (SRP: order DTOs isolated)
// (ISP: OrderSummaryDto for list responses avoids over-fetching; OrderDto for full detail)
public record PlaceOrderRequest(
    [Required] int RestaurantId,
    [Required, MinLength(1, ErrorMessage = "Order must contain at least one item")]
    List<OrderItemRequest> Items,
    [MaxLength(200)] string? DeliveryAddressLine1,
    [MaxLength(100)] string? DeliveryCity,
    string? DeliveryPostcode,
    [Required, MaxLength(100)] string IdempotencyKey,
    string? PaymentIntentId,
    [MaxLength(500)] string? SpecialInstructions = null,
    /// <summary>"Delivery" (default) or "Collection".</summary>
    string OrderType = "Delivery",
    /// <summary>UTC time the customer wants the order ready. Null = ASAP.</summary>
    DateTime? ScheduledFor = null,
    /// <summary>Optional platform-wide promo code to apply at checkout.</summary>
    [MaxLength(50)] string? PromoCode = null,
    /// <summary>Optional gift card code to redeem at checkout.</summary>
    [MaxLength(20)] string? GiftCardCode = null);

public record OrderItemRequest(
    int MenuItemId,
    [Range(1, 50, ErrorMessage = "Quantity must be between 1 and 50")] int Quantity);

/// <summary>
/// Lightweight order summary for list endpoints. (ISP: callers that only need list data
/// aren't forced to receive dispute/delivery fields they don't use)
/// </summary>
public record OrderSummaryDto(int Id, int RestaurantId, int UserId, string Status,
    decimal TotalAmount, DateTime CreatedAt, List<OrderItemDto> Items,
    string OrderType = "Delivery", DateTime? ScheduledFor = null,
    string? PromoCode = null, decimal DiscountAmount = 0m,
    string? GiftCardCode = null, decimal GiftCardDiscount = 0m,
    decimal DeliveryFee = 0m)
{
    /// <summary>Opaque hash of the integer Id — use this in URLs, never the raw int.</summary>
    public string HashId { get; init; } = string.Empty;
}

/// <summary>Full order detail for single-order fetch and admin dispute management.</summary>
public record OrderDto(int Id, int RestaurantId, int UserId, string Status,
    string? RejectionReason, string DisputeStatus, string? DisputeNotes,
    decimal TotalAmount,
    string? DeliveryAddressLine1, string? DeliveryCity, string? DeliveryPostcode,
    string RestaurantName, string? KitchenVideoUrl, string? AngelcamCameraId,
    string? RestaurantPhone,
    DateTime? EstimatedDeliveryTime,
    DateTime CancellableUntil, DateTime CreatedAt, DateTime? DeliveredAt,
    string? SpecialInstructions,
    List<OrderItemDto> Items,
    string OrderType = "Delivery",
    DateTime? ScheduledFor = null,
    string? PromoCode = null, decimal DiscountAmount = 0m,
    string? GiftCardCode = null, decimal GiftCardDiscount = 0m,
    decimal DeliveryFee = 0m,
    decimal PlusDiscount = 0m)
{
    /// <summary>Opaque hash of the integer Id — use this in URLs, never the raw int.</summary>
    public string HashId { get; init; } = string.Empty;
}

public record OrderItemDto(int Id, int MenuItemId, string MenuItemName, int Quantity, decimal UnitPrice);

public record AcceptOrderRequest(
    [Required, Range(5, 180, ErrorMessage = "Estimated minutes must be between 5 and 180")]
    int EstimatedMinutes);

public record RejectOrderRequest(
    [Required, MaxLength(500)] string Reason);

public record UpdateStatusRequest([Required] string Status);

public record DisputeRequest(
    [Required,
     MinLength(10, ErrorMessage = "Please provide at least 10 characters describing the issue"),
     MaxLength(1000)]
    string Notes);

public record ReorderRequest([Required] string IdempotencyKey);

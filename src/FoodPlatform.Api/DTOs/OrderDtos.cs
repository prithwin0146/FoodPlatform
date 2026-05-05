using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: order DTOs isolated)
// (ISP: OrderSummaryDto for list responses avoids over-fetching; OrderDto for full detail)
public record PlaceOrderRequest(
    [Required] int RestaurantId,
    [Required] List<OrderItemRequest> Items,
    [Required] string DeliveryAddressLine1,
    [Required] string DeliveryCity,
    [Required] string DeliveryPostcode,
    [Required] string IdempotencyKey,
    string? PaymentMethodId);

public record OrderItemRequest(int MenuItemId, int Quantity);

/// <summary>
/// Lightweight order summary for list endpoints. (ISP: callers that only need list data
/// aren't forced to receive dispute/delivery fields they don't use)
/// </summary>
public record OrderSummaryDto(int Id, int RestaurantId, int UserId, string Status,
    decimal TotalAmount, DateTime CreatedAt, List<OrderItemDto> Items);

/// <summary>Full order detail for single-order fetch and admin dispute management.</summary>
public record OrderDto(int Id, int RestaurantId, int UserId, string Status,
    string? RejectionReason, string DisputeStatus, string? DisputeNotes,
    decimal TotalAmount, string DeliveryPostcode, DateTime? EstimatedDeliveryTime,
    DateTime CancellableUntil, DateTime CreatedAt, List<OrderItemDto> Items);

public record OrderItemDto(int Id, int MenuItemId, string MenuItemName, int Quantity, decimal UnitPrice);

public record AcceptOrderRequest([Required] int EstimatedMinutes);

public record RejectOrderRequest([Required] string Reason);

public record UpdateStatusRequest([Required] string Status);

public record DisputeRequest([Required] string Notes);

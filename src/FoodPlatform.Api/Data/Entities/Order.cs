namespace FoodPlatform.Api.Data.Entities;

public class Order
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = "Pending";
    public string? RejectionReason { get; set; }
    public string DisputeStatus { get; set; } = "None";  // None | Open | Resolved
    public string? DisputeNotes { get; set; }
    public decimal TotalAmount { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string DeliveryAddressLine1 { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public string DeliveryPostcode { get; set; } = string.Empty;
    /// <summary>Optional kitchen notes from the customer (e.g. allergen requests, cooking preferences). Max 500 chars.</summary>
    public string? SpecialInstructions { get; set; }
    public DateTime? EstimatedDeliveryTime { get; set; }
    /// <summary>Stamped when status transitions to Delivered. Used to enforce the dispute window.</summary>
    public DateTime? DeliveredAt { get; set; }
    public DateTime CancellableUntil { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Restaurant Restaurant { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<OrderItem> Items { get; set; } = [];
}

namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// A prepaid gift card with a redeemable balance.
/// (SRP: balance tracking only — purchase/redemption logic lives in IGiftCardService)
/// </summary>
public class GiftCard
{
    public int Id { get; set; }
    /// <summary>Human-readable code customers use at checkout (e.g. "STP-A1B2-C3D4").</summary>
    public string Code { get; set; } = string.Empty;
    public decimal InitialAmount { get; set; }
    public decimal RemainingBalance { get; set; }
    public bool IsActive { get; set; } = true;
    public int? PurchasedByUserId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? PurchasedByUser { get; set; }
    public ICollection<GiftCardUsage> Usages { get; set; } = [];
}

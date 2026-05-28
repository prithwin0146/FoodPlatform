namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Records each partial or full redemption of a gift card against an order.
/// (SRP: audit trail only)
/// </summary>
public class GiftCardUsage
{
    public int Id { get; set; }
    public int GiftCardId { get; set; }
    public int OrderId { get; set; }
    public decimal AmountUsed { get; set; }
    public DateTime UsedAt { get; set; } = DateTime.UtcNow;

    public GiftCard GiftCard { get; set; } = null!;
    public Order Order { get; set; } = null!;
}

namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Records each redemption of a promo code against a specific order.
/// (SRP: audit trail only — no business logic)
/// </summary>
public class PromoCodeUsage
{
    public int Id { get; set; }
    public int PromoCodeId { get; set; }
    public int UserId { get; set; }
    public int OrderId { get; set; }
    public decimal DiscountApplied { get; set; }
    public DateTime UsedAt { get; set; } = DateTime.UtcNow;

    public PromoCode PromoCode { get; set; } = null!;
    public User User { get; set; } = null!;
    public Order Order { get; set; } = null!;
}

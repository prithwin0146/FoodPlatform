namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Platform-wide promotional / discount codes created by admin.
/// (SRP: data shape only — redemption logic lives in IPromoCodeService)
/// </summary>
public class PromoCode
{
    public int Id { get; set; }
    /// <summary>Case-insensitive code customers enter at checkout (e.g. "SAVE10").</summary>
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    /// <summary>"Percentage" discounts by %, "Fixed" discounts by a £ amount.</summary>
    public string DiscountType { get; set; } = "Percentage";
    /// <summary>Percentage (0–100) or fixed GBP amount, depending on DiscountType.</summary>
    public decimal DiscountValue { get; set; }
    public decimal? MinOrderAmount { get; set; }
    /// <summary>Null = unlimited uses.</summary>
    public int? MaxUses { get; set; }
    public int UsedCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PromoCodeUsage> Usages { get; set; } = [];
}

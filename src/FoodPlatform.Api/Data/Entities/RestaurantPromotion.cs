namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// A time-limited discount offer set by a restaurant (e.g. "20% off all mains").
/// (SRP: promotion data shape only — display + application logic is in the service layer)
/// </summary>
public class RestaurantPromotion
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>"PercentageOff" (e.g. 20%) or "FixedOff" (e.g. £3 off).</summary>
    public string DiscountType { get; set; } = "PercentageOff";
    public decimal DiscountValue { get; set; }
    /// <summary>Null = applies to the entire order; set to restrict to one category.</summary>
    public int? AppliesToCategoryId { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Restaurant Restaurant { get; set; } = null!;
    public MenuCategory? AppliesToCategory { get; set; }
}

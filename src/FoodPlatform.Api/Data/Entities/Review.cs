namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// A customer review submitted after order delivery.
/// (SRP: review data only — display formatting is a frontend concern)
/// </summary>
public class Review
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int CustomerId { get; set; }
    public int RestaurantId { get; set; }

    /// <summary>Star rating 1–5.</summary>
    public int Stars { get; set; }

    /// <summary>Optional free-text comment (max 1000 chars).</summary>
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Order Order { get; set; } = null!;
    public User Customer { get; set; } = null!;
    public Restaurant Restaurant { get; set; } = null!;
}

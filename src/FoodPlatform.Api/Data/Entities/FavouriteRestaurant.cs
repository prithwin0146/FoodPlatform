namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Represents a customer's saved / favourited restaurant.
/// (SRP: owns only the user ↔ restaurant favouriting relationship)
/// </summary>
public class FavouriteRestaurant
{
    public int UserId { get; set; }
    public int RestaurantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Restaurant Restaurant { get; set; } = null!;
}

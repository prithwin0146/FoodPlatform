namespace FoodPlatform.Api.Data.Entities;

public class MenuItem
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? Allergens { get; set; }      // JSON array: ["gluten","milk"]
    public string? DietaryTags { get; set; }    // JSON array: ["vegan","gluten-free"]
    public bool IsAvailable { get; set; } = true;
    /// <summary>Soft-delete flag. True = item has been deleted by staff. Never physically removed from DB (preserves order history).</summary>
    public bool IsDeleted { get; set; } = false;
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Restaurant Restaurant { get; set; } = null!;
    public MenuCategory Category { get; set; } = null!;
}

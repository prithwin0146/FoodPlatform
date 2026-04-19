namespace FoodPlatform.Api.Data.Entities;

public class MenuCategory
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    // Navigation
    public Restaurant Restaurant { get; set; } = null!;
    public ICollection<MenuItem> Items { get; set; } = [];
}

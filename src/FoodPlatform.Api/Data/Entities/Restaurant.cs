namespace FoodPlatform.Api.Data.Entities;

public class Restaurant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string BasePostcode { get; set; } = string.Empty;
    public double DeliveryRadiusMiles { get; set; } = 3.0;
    public int HygieneRating { get; set; }
    public bool IsActive { get; set; } = true;
    public string? StripeAccountId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<RestaurantHours> Hours { get; set; } = [];
    public ICollection<MenuCategory> MenuCategories { get; set; } = [];
    public ICollection<MenuItem> MenuItems { get; set; } = [];
    public ICollection<User> Staff { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
}

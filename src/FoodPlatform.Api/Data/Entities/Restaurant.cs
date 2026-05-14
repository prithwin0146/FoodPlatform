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
    public string? ImageUrl { get; set; }
    /// <summary>Pre-recorded kitchen video URL (YouTube embed, Vimeo, or direct MP4). Replaces placeholder on order-tracking page.</summary>
    public string? KitchenVideoUrl { get; set; }
    /// <summary>Broad cuisine category displayed on the restaurant card (e.g. "Indian", "Italian", "Burgers").</summary>
    public string CuisineType { get; set; } = "Other";
    /// <summary>Advertised preparation + delivery window in minutes shown on the restaurant card.</summary>
    public int EstimatedDeliveryMinutes { get; set; } = 30;
    public string? StripeAccountId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<RestaurantHours> Hours { get; set; } = [];
    public ICollection<MenuCategory> MenuCategories { get; set; } = [];
    public ICollection<MenuItem> MenuItems { get; set; } = [];
    public ICollection<User> Staff { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
}

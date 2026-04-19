namespace FoodPlatform.Api.Data.Entities;

public class User
{
    public int Id { get; set; }
    public int? RestaurantId { get; set; }   // NULL for customers + admin
    public string Role { get; set; } = "Customer";  // "Admin" | "Staff" | "Customer"
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Restaurant? Restaurant { get; set; }
    public ICollection<Order> Orders { get; set; } = [];
}

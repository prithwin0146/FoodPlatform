namespace FoodPlatform.Api.Data.Entities;

public class User
{
    public int Id { get; set; }
    public int? RestaurantId { get; set; }   // NULL for customers + admin
    public string Role { get; set; } = "Customer";  // "Admin" | "Staff" | "Customer"
    public string Username { get; set; } = string.Empty;  // Display name shown in UI greeting
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsEmailVerified { get; set; } = false;
    public string? OtpCode { get; set; }
    public DateTime? OtpExpiresAt { get; set; }
    /// <summary>When the most recent OTP was dispatched. Used to throttle resend requests.</summary>
    public DateTime? OtpSentAt { get; set; }

    // OAuth
    public string AuthProvider { get; set; } = "Local"; // "Local", "Google", "Apple"
    public string? ProviderId { get; set; }

    // Navigation
    public Restaurant? Restaurant { get; set; }
    public ICollection<Order> Orders { get; set; } = [];
}

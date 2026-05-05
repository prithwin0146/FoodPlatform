namespace FoodPlatform.Api.Domain;

/// <summary>
/// Strongly-typed user roles. (SRP: eliminates magic strings for role checking across the codebase)
/// </summary>
public static class UserRole
{
    public const string Admin    = "Admin";
    public const string Staff    = "Staff";
    public const string Customer = "Customer";
}

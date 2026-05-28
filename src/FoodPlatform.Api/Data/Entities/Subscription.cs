namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Tracks a customer's SeeThePrep Plus recurring subscription.
/// (SRP: subscription state only — billing logic delegated to Stripe)
/// </summary>
public class Subscription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string StripeSubscriptionId { get; set; } = string.Empty;
    public string StripeCustomerId { get; set; } = string.Empty;
    /// <summary>"Active" | "Cancelled" | "PastDue"</summary>
    public string Status { get; set; } = "Active";
    public DateTime PeriodEnd { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

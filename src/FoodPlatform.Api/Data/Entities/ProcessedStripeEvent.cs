namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Records Stripe event IDs that have already been processed.
/// Prevents duplicate side-effects if Stripe retries a webhook.
/// (SRP: idempotency tracking only — no business logic)
/// </summary>
public class ProcessedStripeEvent
{
    /// <summary>Stripe event ID (e.g. "evt_xxx") — used as the primary key.</summary>
    public string EventId { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}

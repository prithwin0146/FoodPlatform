using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// ── SeeThePrep Plus Subscription ───────────────────────────────────────────────

public record SubscriptionStatusDto(
    bool IsActive,
    string? Status,        // Active | Cancelled | PastDue | null (never subscribed)
    DateTime? PeriodEnd,
    DateTime? CreatedAt);

public record CreateSubscriptionCheckoutRequest(
    /// <summary>URL to redirect after successful subscription checkout.</summary>
    [Required] string SuccessUrl,
    /// <summary>URL to redirect if customer cancels the Stripe checkout.</summary>
    [Required] string CancelUrl);

public record CreateSubscriptionCheckoutResponse(string CheckoutUrl);

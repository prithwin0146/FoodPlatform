using Stripe;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Handles the business effects of verified Stripe webhook events (payment success/failure,
/// subscription lifecycle). (SRP: webhook business logic isolated from HTTP/signature parsing,
/// which stays in StripeWebhooksController) (DIP: controller depends on this abstraction, not DbContext)
/// </summary>
public interface IStripeWebhookHandlerService
{
    /// <summary>Records the event as processed; returns false if it was already handled (duplicate).</summary>
    Task<bool> MarkProcessedAsync(string eventId);

    Task HandlePaymentSucceededAsync(PaymentIntent? intent);
    Task HandlePaymentFailedAsync(PaymentIntent? intent);
    Task HandleSubscriptionCreatedAsync(Subscription? sub);
    Task HandleSubscriptionUpdatedAsync(Subscription? sub);
}

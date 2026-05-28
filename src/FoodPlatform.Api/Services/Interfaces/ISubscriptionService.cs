using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// SeeThePrep Plus subscription lifecycle.
/// (SRP: subscription operations only — billing webhook handling delegated to StripeWebhooksController)
/// </summary>
public interface ISubscriptionService
{
    /// <summary>Returns the current subscription status for a user. Returns null status if never subscribed.</summary>
    Task<SubscriptionStatusDto> GetStatusAsync(int userId);

    /// <summary>Creates a Stripe Checkout Session for a new subscription and returns the redirect URL.</summary>
    Task<CreateSubscriptionCheckoutResponse> CreateCheckoutSessionAsync(
        int userId, string userEmail, CreateSubscriptionCheckoutRequest request);

    /// <summary>Cancels the user's active subscription at period end.</summary>
    Task<bool> CancelAsync(int userId);

    /// <summary>Called from the Stripe webhook handler to sync subscription state.</summary>
    Task HandleSubscriptionUpdatedAsync(string stripeSubscriptionId, string status, DateTime periodEnd);

    /// <summary>Called from the Stripe webhook handler when a new subscription is created.</summary>
    Task HandleSubscriptionCreatedAsync(
        string stripeSubscriptionId, string stripeCustomerId, string userEmail,
        string status, DateTime periodEnd);
}

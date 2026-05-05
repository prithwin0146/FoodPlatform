namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Stripe payment contract.
/// (SRP: Stripe API calls only — no business logic or DB access)
/// (DIP: OrderService depends on this abstraction, not on Stripe.net directly)
/// </summary>
public interface IStripeService
{
    /// <summary>Creates a PaymentIntent for the given amount in GBP pence.</summary>
    Task<(string ClientSecret, string PaymentIntentId)> CreatePaymentIntentAsync(
        decimal amountGbp, string idempotencyKey);

    /// <summary>
    /// Returns true when the PaymentIntent has status "succeeded" and the captured
    /// amount matches <paramref name="expectedGbp"/> (within a penny tolerance).
    /// </summary>
    Task<bool> VerifyPaymentSucceededAsync(string paymentIntentId, decimal expectedGbp);

    /// <summary>Issues a full refund for the given PaymentIntent.</summary>
    Task RefundAsync(string paymentIntentId);
}

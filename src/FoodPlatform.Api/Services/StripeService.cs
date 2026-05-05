using FoodPlatform.Api.Services.Interfaces;
using Stripe;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Wraps Stripe.net for payment intent lifecycle operations.
/// (SRP: Stripe API calls only — no DB access, no business logic)
/// (DIP: callers depend on IStripeService, not Stripe.net SDK directly)
/// </summary>
public class StripeService : IStripeService
{
    private readonly ILogger<StripeService> _logger;
    private readonly bool _isConfigured;

    public StripeService(IConfiguration config, ILogger<StripeService> logger)
    {
        _logger = logger;
        var key = config["Stripe:SecretKey"] ?? string.Empty;
        _isConfigured = key.StartsWith("sk_", StringComparison.Ordinal);
        if (_isConfigured)
            StripeConfiguration.ApiKey = key;
        else
            _logger.LogWarning("Stripe secret key not configured — payment calls will be skipped");
    }

    public async Task<(string ClientSecret, string PaymentIntentId)> CreatePaymentIntentAsync(
        decimal amountGbp, string idempotencyKey)
    {
        if (!_isConfigured)
            return ("pi_mock_secret_" + Guid.NewGuid().ToString("N")[..12],
                    "pi_mock_" + Guid.NewGuid().ToString("N")[..16]);

        var options = new PaymentIntentCreateOptions
        {
            Amount = ToStripeAmount(amountGbp),
            Currency = "gbp",
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
            Metadata = new Dictionary<string, string>
            {
                ["idempotencyKey"] = idempotencyKey
            }
        };

        var requestOptions = new RequestOptions { IdempotencyKey = idempotencyKey };
        var service = new PaymentIntentService();
        var intent = await service.CreateAsync(options, requestOptions);
        return (intent.ClientSecret, intent.Id);
    }

    public async Task<bool> VerifyPaymentSucceededAsync(string paymentIntentId, decimal expectedGbp)
    {
        if (!_isConfigured || paymentIntentId.StartsWith("pi_mock_", StringComparison.Ordinal))
            return true; // Dev mode: skip verification

        var service = new PaymentIntentService();
        var intent = await service.GetAsync(paymentIntentId);

        if (intent.Status != "succeeded") return false;

        // Verify the amount wasn't tampered with (allow 1p tolerance for rounding)
        var expectedPence = ToStripeAmount(expectedGbp);
        return Math.Abs(intent.Amount - expectedPence) <= 1;
    }

    public async Task RefundAsync(string paymentIntentId)
    {
        if (!_isConfigured || paymentIntentId.StartsWith("pi_mock_", StringComparison.Ordinal))
            return; // Dev mode: no-op

        try
        {
            var options = new RefundCreateOptions { PaymentIntent = paymentIntentId };
            var service = new RefundService();
            await service.CreateAsync(options);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe refund failed for {PaymentIntentId}", paymentIntentId);
            throw;
        }
    }

    private static long ToStripeAmount(decimal gbp) => (long)Math.Round(gbp * 100, 0);
}

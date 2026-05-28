using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Stripe.Checkout;

namespace FoodPlatform.Api.Services;

/// <summary>
/// SeeThePrep Plus subscription lifecycle management via Stripe.
/// (SRP: subscription state only — payment session creation delegated to Stripe Checkout)
/// (DIP: Stripe SDK accessed only in this class; controllers depend on ISubscriptionService)
/// </summary>
public class SubscriptionService : ISubscriptionService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<SubscriptionService> _logger;
    private readonly bool _isConfigured;

    public SubscriptionService(FoodPlatformDbContext db, IConfiguration config, ILogger<SubscriptionService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
        var key = config["Stripe:SecretKey"] ?? string.Empty;
        _isConfigured = (key.StartsWith("sk_live_") || key.StartsWith("sk_test_"))
                     && !key.Contains("placeholder", StringComparison.OrdinalIgnoreCase);
        if (_isConfigured)
            Stripe.StripeConfiguration.ApiKey = key;
    }

    public async Task<SubscriptionStatusDto> GetStatusAsync(int userId)
    {
        var sub = await _db.Subscriptions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        if (sub is null) return new SubscriptionStatusDto(false, null, null, null);

        var isActive = sub.Status == "Active" && sub.PeriodEnd > DateTime.UtcNow;
        return new SubscriptionStatusDto(isActive, sub.Status, sub.PeriodEnd, sub.CreatedAt);
    }

    public async Task<CreateSubscriptionCheckoutResponse> CreateCheckoutSessionAsync(
        int userId, string userEmail, CreateSubscriptionCheckoutRequest request)
    {
        if (!_isConfigured)
        {
            // Demo mode: simulate a successful subscription
            var existing = await _db.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == "Active");
            if (existing is null)
            {
                _db.Subscriptions.Add(new Subscription
                {
                    UserId = userId,
                    StripeSubscriptionId = "sub_demo_" + Guid.NewGuid().ToString("N")[..16],
                    StripeCustomerId = "cus_demo_" + Guid.NewGuid().ToString("N")[..16],
                    Status = "Active",
                    PeriodEnd = DateTime.UtcNow.AddMonths(1),
                });
                await _db.SaveChangesAsync();
            }
            return new CreateSubscriptionCheckoutResponse(request.SuccessUrl + "?demo=1");
        }

        var priceId = _config["Stripe:PlusPriceId"]
            ?? throw new InvalidOperationException("Stripe:PlusPriceId is not configured");

        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            CustomerEmail = userEmail,
            LineItems = [new SessionLineItemOptions { Price = priceId, Quantity = 1 }],
            SuccessUrl = request.SuccessUrl,
            CancelUrl = request.CancelUrl,
            Metadata = new Dictionary<string, string> { ["userId"] = userId.ToString() },
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);
        return new CreateSubscriptionCheckoutResponse(session.Url);
    }

    public async Task<bool> CancelAsync(int userId)
    {
        var sub = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == "Active");
        if (sub is null) return false;

        if (_isConfigured && !sub.StripeSubscriptionId.StartsWith("sub_demo_"))
        {
            var service = new Stripe.SubscriptionService();
            await service.CancelAsync(sub.StripeSubscriptionId,
                new Stripe.SubscriptionCancelOptions { InvoiceNow = false, Prorate = false });
        }

        sub.Status = "Cancelled";
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task HandleSubscriptionUpdatedAsync(string stripeSubscriptionId, string status, DateTime periodEnd)
    {
        var sub = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscriptionId);
        if (sub is null) return;

        sub.Status = MapStripeStatus(status);
        sub.PeriodEnd = periodEnd;
        await _db.SaveChangesAsync();
    }

    public async Task HandleSubscriptionCreatedAsync(
        string stripeSubscriptionId, string stripeCustomerId, string userEmail,
        string status, DateTime periodEnd)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user is null)
        {
            _logger.LogWarning("Subscription webhook: no user found for email {Email}", userEmail);
            return;
        }

        var existing = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscriptionId);
        if (existing is not null) return; // already processed

        _db.Subscriptions.Add(new Subscription
        {
            UserId = user.Id,
            StripeSubscriptionId = stripeSubscriptionId,
            StripeCustomerId = stripeCustomerId,
            Status = MapStripeStatus(status),
            PeriodEnd = periodEnd,
        });
        await _db.SaveChangesAsync();
    }

    private static string MapStripeStatus(string stripeStatus) => stripeStatus switch
    {
        "active" => "Active",
        "past_due" => "PastDue",
        _ => "Cancelled",
    };
}

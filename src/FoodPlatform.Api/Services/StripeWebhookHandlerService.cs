using FoodPlatform.Api.Data;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Implements the business effects of verified Stripe webhook events.
/// (SRP: all DbContext access for webhook-driven mutations lives here — the controller
///  never touches persistence directly)
/// (DIP: StripeWebhooksController depends on IStripeWebhookHandlerService, not this concrete
///  class or FoodPlatformDbContext)
/// </summary>
public class StripeWebhookHandlerService : IStripeWebhookHandlerService
{
    private readonly FoodPlatformDbContext _db;
    private readonly ILogger<StripeWebhookHandlerService> _logger;
    private readonly ISubscriptionService _subscriptions;

    public StripeWebhookHandlerService(
        FoodPlatformDbContext db,
        ILogger<StripeWebhookHandlerService> logger,
        ISubscriptionService subscriptions)
    {
        _db = db;
        _logger = logger;
        _subscriptions = subscriptions;
    }

    /// <summary>
    /// Inserts the event ID; returns false if the event was already processed.
    /// Relies on a unique constraint to avoid a race between two simultaneous retries.
    /// </summary>
    public async Task<bool> MarkProcessedAsync(string eventId)
    {
        try
        {
            _db.ProcessedStripeEvents.Add(new Data.Entities.ProcessedStripeEvent { EventId = eventId });
            await _db.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException)
        {
            // Unique constraint violated — duplicate event
            _logger.LogInformation("Duplicate Stripe event {EventId} skipped", eventId);
            return false;
        }
    }

    public async Task HandlePaymentSucceededAsync(PaymentIntent? intent)
    {
        if (intent is null) return;

        // Primary lookup: find order by PaymentIntentId (normal happy path)
        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == intent.Id);

        if (order is not null && order.Status == "Pending")
        {
            _logger.LogInformation(
                "Webhook: payment_intent.succeeded for order {OrderId}", order.Id);
            // Sync flow already created the order and verified payment — no action needed.
            // The webhook is a safety net confirming the payment was received.
        }
        else if (order is null)
        {
            // Order not found by PaymentIntentId — may mean PlaceOrderAsync is still in-flight
            // or crashed before persisting. Log for alerting; no corrective action here
            // (the idempotency key allows the client to safely retry PlaceOrder).
            _logger.LogWarning(
                "Webhook: payment_intent.succeeded for PaymentIntent {PIId} but no matching order found. " +
                "Client should retry PlaceOrder with its idempotency key.", intent.Id);
        }
    }

    public async Task HandlePaymentFailedAsync(PaymentIntent? intent)
    {
        if (intent is null) return;

        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == intent.Id
                                   && o.Status == "Pending");

        if (order is not null)
        {
            order.Status = "Cancelled";
            await _db.SaveChangesAsync();
            _logger.LogWarning(
                "Webhook: payment failed — order {OrderId} cancelled", order.Id);
        }
    }

    public async Task HandleSubscriptionCreatedAsync(Subscription? sub)
    {
        if (sub is null) return;
        var userEmail = sub.Customer?.Email ?? string.Empty;
        var periodEnd = sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd ?? DateTime.UtcNow.AddMonths(1);
        await _subscriptions.HandleSubscriptionCreatedAsync(
            sub.Id, sub.CustomerId, userEmail, sub.Status, periodEnd);
    }

    public async Task HandleSubscriptionUpdatedAsync(Subscription? sub)
    {
        if (sub is null) return;
        var periodEnd = sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd ?? DateTime.UtcNow.AddMonths(1);
        await _subscriptions.HandleSubscriptionUpdatedAsync(sub.Id, sub.Status, periodEnd);
    }
}

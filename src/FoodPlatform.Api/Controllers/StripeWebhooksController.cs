using FoodPlatform.Api.Data;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Receives Stripe webhook events to handle async payment lifecycle events.
/// (SRP: webhook processing only — business effects delegated to domain services)
/// </summary>
[Route("api/webhooks/stripe")]
[AllowAnonymous]
[ApiController]
public class StripeWebhooksController : ControllerBase
{
    private readonly FoodPlatformDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<StripeWebhooksController> _logger;
    private readonly ISubscriptionService _subscriptions;

    public StripeWebhooksController(
        FoodPlatformDbContext db,
        IConfiguration config,
        ILogger<StripeWebhooksController> logger,
        ISubscriptionService subscriptions)
    {
        _db = db;
        _config = config;
        _logger = logger;
        _subscriptions = subscriptions;
    }

    [HttpPost]
    public async Task<IActionResult> Handle()
    {
        var webhookSecret = _config["Stripe:WebhookSecret"];
        if (string.IsNullOrEmpty(webhookSecret)
            || webhookSecret.Contains("placeholder", StringComparison.OrdinalIgnoreCase))
            return Ok(new { received = true }); // Dev/unconfigured: no-op

        string json;
        using (var reader = new StreamReader(HttpContext.Request.Body))
            json = await reader.ReadToEndAsync();

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                json,
                Request.Headers["Stripe-Signature"],
                webhookSecret);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Invalid Stripe webhook signature");
            return BadRequest();
        }

        switch (stripeEvent.Type)
        {
            case "payment_intent.succeeded":
                if (!await MarkProcessedAsync(stripeEvent.Id)) return Ok(new { received = true, duplicate = true });
                await HandlePaymentSucceededAsync(stripeEvent.Data.Object as PaymentIntent);
                break;

            case "payment_intent.payment_failed":
                if (!await MarkProcessedAsync(stripeEvent.Id)) return Ok(new { received = true, duplicate = true });
                await HandlePaymentFailedAsync(stripeEvent.Data.Object as PaymentIntent);
                break;

            case "customer.subscription.created":
                if (!await MarkProcessedAsync(stripeEvent.Id)) return Ok(new { received = true, duplicate = true });
                await HandleSubscriptionCreatedAsync(stripeEvent.Data.Object as Stripe.Subscription);
                break;

            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                if (!await MarkProcessedAsync(stripeEvent.Id)) return Ok(new { received = true, duplicate = true });
                await HandleSubscriptionUpdatedAsync(stripeEvent.Data.Object as Stripe.Subscription);
                break;
        }

        return Ok(new { received = true });
    }

    // ── private ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Inserts the event ID; returns false if the event was already processed.
    /// Uses INSERT … ON CONFLICT DO NOTHING to avoid a race between two simultaneous retries.
    /// (SRP: idempotency concern isolated here — business handlers stay pure)
    /// </summary>
    private async Task<bool> MarkProcessedAsync(string eventId)
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

    private async Task HandlePaymentSucceededAsync(PaymentIntent? intent)
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

    private async Task HandlePaymentFailedAsync(PaymentIntent? intent)
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

    private async Task HandleSubscriptionCreatedAsync(Stripe.Subscription? sub)
    {
        if (sub is null) return;
        var userEmail = sub.Customer?.Email ?? string.Empty;
        var periodEnd = sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd ?? DateTime.UtcNow.AddMonths(1);
        await _subscriptions.HandleSubscriptionCreatedAsync(
            sub.Id, sub.CustomerId, userEmail, sub.Status, periodEnd);
    }

    private async Task HandleSubscriptionUpdatedAsync(Stripe.Subscription? sub)
    {
        if (sub is null) return;
        var periodEnd = sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd ?? DateTime.UtcNow.AddMonths(1);
        await _subscriptions.HandleSubscriptionUpdatedAsync(sub.Id, sub.Status, periodEnd);
    }
}

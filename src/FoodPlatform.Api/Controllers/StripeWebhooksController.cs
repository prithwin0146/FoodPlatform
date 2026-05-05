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

    public StripeWebhooksController(
        FoodPlatformDbContext db,
        IConfiguration config,
        ILogger<StripeWebhooksController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Handle()
    {
        var webhookSecret = _config["Stripe:WebhookSecret"];
        if (string.IsNullOrEmpty(webhookSecret) || webhookSecret == "whsec_placeholder")
            return Ok(new { received = true }); // Dev: no-op

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
                await HandlePaymentSucceededAsync(stripeEvent.Data.Object as PaymentIntent);
                break;

            case "payment_intent.payment_failed":
                await HandlePaymentFailedAsync(stripeEvent.Data.Object as PaymentIntent);
                break;
        }

        return Ok(new { received = true });
    }

    // ── private ──────────────────────────────────────────────────────────────

    private async Task HandlePaymentSucceededAsync(PaymentIntent? intent)
    {
        if (intent is null) return;

        // If the order is still "Pending" with this PaymentIntentId, it's confirmed
        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == intent.Id);

        if (order is not null && order.Status == "Pending")
        {
            _logger.LogInformation(
                "Webhook: payment_intent.succeeded for order {OrderId}", order.Id);
            // Order was already created when payment was confirmed — nothing else to do
            // (the sync flow already handles this; webhook is a safety net)
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
}

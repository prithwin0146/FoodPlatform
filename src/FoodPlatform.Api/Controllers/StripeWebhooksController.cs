using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Receives Stripe webhook events to handle async payment lifecycle events.
/// (SRP: HTTP + signature verification only - business effects delegated to IStripeWebhookHandlerService)
/// (DIP: depends on IStripeWebhookHandlerService abstraction, not DbContext)
/// </summary>
[Route("api/webhooks/stripe")]
[AllowAnonymous]
[ApiController]
public class StripeWebhooksController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ILogger<StripeWebhooksController> _logger;
    private readonly IStripeWebhookHandlerService _handler;

    public StripeWebhooksController(
        IConfiguration config,
        ILogger<StripeWebhooksController> logger,
        IStripeWebhookHandlerService handler)
    {
        _config = config;
        _logger = logger;
        _handler = handler;
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
                if (!await _handler.MarkProcessedAsync(stripeEvent.Id)) return Ok(new { received = true, duplicate = true });
                await _handler.HandlePaymentSucceededAsync(stripeEvent.Data.Object as PaymentIntent);
                break;

            case "payment_intent.payment_failed":
                if (!await _handler.MarkProcessedAsync(stripeEvent.Id)) return Ok(new { received = true, duplicate = true });
                await _handler.HandlePaymentFailedAsync(stripeEvent.Data.Object as PaymentIntent);
                break;

            case "customer.subscription.created":
                if (!await _handler.MarkProcessedAsync(stripeEvent.Id)) return Ok(new { received = true, duplicate = true });
                await _handler.HandleSubscriptionCreatedAsync(stripeEvent.Data.Object as Stripe.Subscription);
                break;

            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                if (!await _handler.MarkProcessedAsync(stripeEvent.Id)) return Ok(new { received = true, duplicate = true });
                await _handler.HandleSubscriptionUpdatedAsync(stripeEvent.Data.Object as Stripe.Subscription);
                break;
        }

        return Ok(new { received = true });
    }
}

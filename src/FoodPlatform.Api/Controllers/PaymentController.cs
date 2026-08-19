using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Exposes a single endpoint to create a Stripe PaymentIntent before an order is placed.
/// The amount is the FINAL amount owed (items + delivery − promo − gift card), computed
/// server-side via IOrderPricingService — the same service OrderService uses when persisting
/// the order, so the card is charged exactly what the customer is shown.
/// (SRP: payment intent creation is isolated from the order flow)
/// (DIP: depends on IRestaurantQueryService + IOrderPricingService + IStripeService abstractions — no DbContext)
/// </summary>
[Route("api/payment-intent")]
[Authorize(Roles = "Customer")]
public class PaymentController : RestaurantScopedController
{
    private readonly IRestaurantQueryService _restaurants;
    private readonly IStripeService _stripe;
    private readonly IOrderPricingService _pricing;

    public PaymentController(IRestaurantQueryService restaurants, IStripeService stripe, IOrderPricingService pricing)
    {
        _restaurants = restaurants;
        _stripe = stripe;
        _pricing = pricing;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePaymentIntentRequest request)
    {
        // Validate restaurant is active
        var restaurantActive = await _restaurants.IsActiveAsync(request.RestaurantId);

        if (!restaurantActive)
            return BadRequest(new { error = "Restaurant not found or inactive" });

        // Compute the authoritative FINAL amount server-side (prevents price tampering AND
        // ensures the charge matches the displayed total — including delivery/promo/gift card).
        var pricing = await _pricing.CalculateAsync(
            request.RestaurantId,
            request.Items,
            request.OrderType,
            request.PromoCode,
            request.GiftCardCode,
            CurrentUserId);

        if (!pricing.IsSuccess)
            return BadRequest(new { error = pricing.ErrorMessage });

        var finalTotal = pricing.Value!.FinalTotal;

        // Create the Stripe PaymentIntent for the final amount — idempotent using the client-supplied key
        var (clientSecret, paymentIntentId) =
            await _stripe.CreatePaymentIntentAsync(finalTotal, request.IdempotencyKey);

        return Ok(new CreatePaymentIntentResponse(clientSecret, paymentIntentId, finalTotal));
    }
}

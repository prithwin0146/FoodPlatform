using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

/// <summary>
/// Request to create a Stripe PaymentIntent before placing an order.
/// The backend computes the FINAL amount server-side (items + delivery − promo − gift card)
/// so the customer is charged exactly what they are shown — not just the items subtotal.
/// </summary>
public record CreatePaymentIntentRequest(
    [Required] int RestaurantId,
    [Required] List<OrderItemRequest> Items,
    [Required] string IdempotencyKey,
    /// <summary>"Delivery" (default) or "Collection" — determines whether a delivery fee applies.</summary>
    string OrderType = "Delivery",
    /// <summary>Optional platform promo code to apply.</summary>
    [MaxLength(50)] string? PromoCode = null,
    /// <summary>Optional gift card code to redeem.</summary>
    [MaxLength(20)] string? GiftCardCode = null);

/// <summary>Returned to the frontend so Stripe.js can confirm the payment.</summary>
public record CreatePaymentIntentResponse(
    string ClientSecret,
    string PaymentIntentId,
    decimal Amount);

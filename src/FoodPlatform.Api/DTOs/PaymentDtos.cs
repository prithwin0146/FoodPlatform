using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

/// <summary>
/// Request to create a Stripe PaymentIntent before placing an order.
/// The backend validates items and computes the total server-side to prevent price tampering.
/// </summary>
public record CreatePaymentIntentRequest(
    [Required] int RestaurantId,
    [Required] List<OrderItemRequest> Items,
    [Required] string IdempotencyKey);

/// <summary>Returned to the frontend so Stripe.js can confirm the payment.</summary>
public record CreatePaymentIntentResponse(
    string ClientSecret,
    string PaymentIntentId,
    decimal Amount);

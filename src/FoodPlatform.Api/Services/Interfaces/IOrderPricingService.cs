using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// A single priced order line — the unit price is snapshotted from the live menu
/// so later menu-price changes never affect an in-flight order.
/// </summary>
public record PricedLineItem(int MenuItemId, int Quantity, decimal UnitPrice);

/// <summary>
/// The canonical, server-computed cost breakdown for an order. This is the single
/// source of truth used both when creating the Stripe PaymentIntent and when
/// persisting the order — guaranteeing the customer is charged exactly what they owe.
/// </summary>
public record OrderPricing(
    IReadOnlyList<PricedLineItem> Items,
    decimal ItemsSubtotal,
    decimal DeliveryFee,
    decimal PromoDiscount,
    int? PromoCodeId,
    string? PromoCodeText,
    decimal GiftCardDiscount,
    string? GiftCardCodeText,
    decimal FinalTotal,
    decimal PlusDiscount = 0m,
    bool IsPlusMember = false,
    decimal CreditApplied = 0m);

/// <summary>
/// Computes the authoritative price of an order (items + delivery − promo − gift card).
/// (SRP: pricing math only — no order persistence, no Stripe calls, no hours/postcode validation)
/// (DIP: callers depend on this abstraction; both PaymentController and OrderService use it
///  so the amount charged and the amount recorded can never diverge)
/// </summary>
public interface IOrderPricingService
{
    /// <summary>Standard delivery fee (GBP). Waived for collection orders and SeeThePrep Plus members.</summary>
    const decimal StandardDeliveryFee = 2.50m;

    /// <summary>SeeThePrep Plus members get this fraction off their items subtotal (e.g. 0.10 = 10% off).</summary>
    const decimal PlusDiscountRate = 0.10m;

    /// <summary>Minimum items subtotal (GBP) required for a Plus member to receive the member discount.</summary>
    const decimal PlusMinSpend = 15.00m;

    Task<ServiceResult<OrderPricing>> CalculateAsync(
        int restaurantId,
        IEnumerable<OrderItemRequest> items,
        string orderType,
        string? promoCode,
        string? giftCardCode,
        int userId,
        bool useAccountCredit = false);
}

using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Single source of truth for what an order costs. Computing the price in exactly one
/// place is what prevents the "charged X, shown Y, recorded Z" class of money bugs:
/// the PaymentIntent amount and the persisted order total are both derived from this.
/// (SRP: pricing only — order placement validation/persistence stays in OrderService)
/// (DIP: depends on IPromoCodeService, IGiftCardService, ISubscriptionService abstractions)
/// </summary>
public class OrderPricingService : IOrderPricingService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IPromoCodeService _promoCodes;
    private readonly IGiftCardService _giftCards;
    private readonly ISubscriptionService _subscriptions;

    public OrderPricingService(
        FoodPlatformDbContext db,
        IPromoCodeService promoCodes,
        IGiftCardService giftCards,
        ISubscriptionService subscriptions)
    {
        _db = db;
        _promoCodes = promoCodes;
        _giftCards = giftCards;
        _subscriptions = subscriptions;
    }

    public async Task<ServiceResult<OrderPricing>> CalculateAsync(
        int restaurantId,
        IEnumerable<OrderItemRequest> items,
        string orderType,
        string? promoCode,
        string? giftCardCode,
        int userId)
    {
        var isCollection = string.Equals(orderType, "Collection", StringComparison.OrdinalIgnoreCase);

        // Deduplicate: merge identical MenuItemIds so we never price the same item twice.
        var deduplicated = items
            .GroupBy(i => i.MenuItemId)
            .Select(g => new OrderItemRequest(g.Key, g.Sum(x => x.Quantity)))
            .ToList();

        if (deduplicated.Count == 0)
            return ServiceResult<OrderPricing>.Fail(OrderServiceError.ValidationFailed, "Order must contain at least one item");

        var menuItemIds = deduplicated.Select(i => i.MenuItemId).ToList();
        var menuItems = await _db.MenuItems
            .Where(m => menuItemIds.Contains(m.Id) && m.RestaurantId == restaurantId && m.IsAvailable)
            .ToDictionaryAsync(m => m.Id);

        if (menuItems.Count != menuItemIds.Distinct().Count())
            return ServiceResult<OrderPricing>.Fail(OrderServiceError.ValidationFailed, "One or more items are unavailable");

        // ── Items subtotal (prices snapshotted from the live menu) ──────────────
        decimal subtotal = 0m;
        var lineItems = new List<PricedLineItem>(deduplicated.Count);
        foreach (var item in deduplicated)
        {
            var menuItem = menuItems[item.MenuItemId];
            subtotal += menuItem.Price * item.Quantity;
            lineItems.Add(new PricedLineItem(item.MenuItemId, item.Quantity, menuItem.Price));
        }

        // ── Delivery fee (waived for collection and SeeThePrep Plus members) ────
        var isPlus = (await _subscriptions.GetStatusAsync(userId)).IsActive;
        var deliveryFee = isCollection || isPlus ? 0m : IOrderPricingService.StandardDeliveryFee;

        // ── Promo code (re-validated server-side against the items subtotal) ────
        decimal promoDiscount = 0m;
        int? promoCodeId = null;
        string? promoCodeText = null;
        if (!string.IsNullOrWhiteSpace(promoCode))
        {
            var promoResult = await _promoCodes.ValidateAsync(promoCode, subtotal, userId);
            if (promoResult.IsValid && promoResult.DiscountAmount.HasValue)
            {
                promoDiscount = promoResult.DiscountAmount.Value;
                promoCodeText = promoCode.ToUpperInvariant().Trim();
                var promoEntity = await _db.PromoCodes
                    .FirstOrDefaultAsync(p => p.Code.ToLower() == promoCode.ToLower() && p.IsActive);
                promoCodeId = promoEntity?.Id;
            }
        }

        // ── Gift card (reserved against the post-promo amount owed) ─────────────
        decimal giftCardDiscount = 0m;
        string? giftCardCodeText = null;
        if (!string.IsNullOrWhiteSpace(giftCardCode))
        {
            var gcResult = await _giftCards.ValidateAsync(giftCardCode);
            if (gcResult.IsValid && gcResult.RemainingBalance.HasValue)
            {
                var owedBeforeGiftCard = Math.Max(0m, subtotal + deliveryFee - promoDiscount);
                giftCardDiscount = Math.Min(gcResult.RemainingBalance.Value, owedBeforeGiftCard);
                giftCardCodeText = giftCardCode.ToUpperInvariant().Trim();
            }
        }

        var finalTotal = Math.Max(0m, subtotal + deliveryFee - promoDiscount - giftCardDiscount);

        return ServiceResult<OrderPricing>.Ok(new OrderPricing(
            lineItems,
            ItemsSubtotal: subtotal,
            DeliveryFee: deliveryFee,
            PromoDiscount: promoDiscount,
            PromoCodeId: promoCodeId,
            PromoCodeText: promoCodeText,
            GiftCardDiscount: giftCardDiscount,
            GiftCardCodeText: giftCardCodeText,
            FinalTotal: finalTotal));
    }
}

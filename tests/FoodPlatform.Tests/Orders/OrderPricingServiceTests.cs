using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services;
using FoodPlatform.Api.Services.Interfaces;
using FoodPlatform.Tests.Helpers;
using NSubstitute;
using Xunit;

namespace FoodPlatform.Tests.Orders;

/// <summary>
/// Tests for OrderPricingService — the single source of truth for what an order costs.
/// These lock in the fix for the bug where the Stripe charge, the displayed total, and
/// the recorded order total could all differ (delivery fee never charged, discounts ignored).
/// </summary>
public class OrderPricingServiceTests
{
    private const decimal DeliveryFee = 2.50m;

    private static OrderPricingService Build(
        out FoodPlatformDbContext db,
        decimal? promoDiscount = null,
        decimal? giftCardBalance = null,
        bool isPlus = false,
        decimal availableCredit = 0m)
    {
        db = DbFactory.Create();

        var promoCodes = Substitute.For<IPromoCodeService>();
        promoCodes.ValidateAsync(Arg.Any<string>(), Arg.Any<decimal>(), Arg.Any<int>())
            .Returns(promoDiscount is null
                ? new ValidatePromoCodeResponse(false, "n/a", null, null, null)
                : new ValidatePromoCodeResponse(true, "ok", "Fixed", promoDiscount, promoDiscount));

        var giftCards = Substitute.For<IGiftCardService>();
        giftCards.ValidateAsync(Arg.Any<string>())
            .Returns(giftCardBalance is null
                ? new ValidateGiftCardResponse(false, "n/a", null)
                : new ValidateGiftCardResponse(true, "ok", giftCardBalance));

        var subscriptions = Substitute.For<ISubscriptionService>();
        subscriptions.GetStatusAsync(Arg.Any<int>())
            .Returns(new SubscriptionStatusDto(isPlus, isPlus ? "Active" : null, null, null));

        var loyalty = Substitute.For<ILoyaltyService>();
        loyalty.GetAvailableCreditAsync(Arg.Any<int>()).Returns(availableCredit);

        return new OrderPricingService(db, promoCodes, giftCards, subscriptions, loyalty);
    }

    private static async Task<MenuItem> SeedItemAsync(FoodPlatformDbContext db, decimal price)
    {
        var restaurant = new Restaurant
        {
            Id = 1, Name = "Test Kitchen", Address = "1 Test St",
            BasePostcode = "SW1A1AA", IsActive = true, SupportsCollection = true
        };
        db.Restaurants.Add(restaurant);
        var category = new MenuCategory { RestaurantId = 1, Name = "Mains", SortOrder = 1 };
        db.MenuCategories.Add(category);
        await db.SaveChangesAsync();

        var item = new MenuItem
        {
            RestaurantId = 1, CategoryId = category.Id,
            Name = "Burger", Price = price, IsAvailable = true
        };
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    [Fact]
    public async Task Delivery_NoDiscounts_AddsDeliveryFee()
    {
        var svc = Build(out var db);
        var item = await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(item.Id, 2)], "Delivery", null, null, userId: 1);

        Assert.True(result.IsSuccess);
        Assert.Equal(20m, result.Value!.ItemsSubtotal);
        Assert.Equal(DeliveryFee, result.Value.DeliveryFee);
        Assert.Equal(22.50m, result.Value.FinalTotal); // 20 + 2.50
    }

    [Fact]
    public async Task Collection_NoDeliveryFee()
    {
        var svc = Build(out var db);
        var item = await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(item.Id, 2)], "Collection", null, null, userId: 1);

        Assert.True(result.IsSuccess);
        Assert.Equal(0m, result.Value!.DeliveryFee);
        Assert.Equal(20m, result.Value.FinalTotal);
    }

    [Fact]
    public async Task PlusMember_DeliveryFeeWaived()
    {
        var svc = Build(out var db, isPlus: true);
        var item = await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(item.Id, 2)], "Delivery", null, null, userId: 1);

        Assert.True(result.IsSuccess);
        Assert.Equal(0m, result.Value!.DeliveryFee);
        // Plus also gets 10% off items when subtotal >= £15: £20 - £2 = £18
        Assert.Equal(2m, result.Value.PlusDiscount);
        Assert.Equal(18m, result.Value.FinalTotal);
    }

    /// <summary>
    /// The exact scenario from the bug report: items £20 + £2.50 delivery − £5 promo − £10 gift card.
    /// The customer must owe £7.50 — this is the amount that should be charged AND recorded.
    /// </summary>
    [Fact]
    public async Task Delivery_WithPromoAndGiftCard_ComputesFinalAmountOwed()
    {
        var svc = Build(out var db, promoDiscount: 5m, giftCardBalance: 10m);
        var item = await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(item.Id, 2)], "Delivery", "SAVE5", "GC10", userId: 1);

        Assert.True(result.IsSuccess);
        var p = result.Value!;
        Assert.Equal(20m, p.ItemsSubtotal);
        Assert.Equal(2.50m, p.DeliveryFee);
        Assert.Equal(5m, p.PromoDiscount);
        Assert.Equal(10m, p.GiftCardDiscount);
        Assert.Equal(7.50m, p.FinalTotal); // 20 + 2.50 − 5 − 10
    }

    [Fact]
    public async Task GiftCard_NeverExceedsAmountOwed()
    {
        // £20 items + £2.50 delivery − £5 promo = £17.50 owed; a £50 gift card can only cover £17.50.
        var svc = Build(out var db, promoDiscount: 5m, giftCardBalance: 50m);
        var item = await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(item.Id, 2)], "Delivery", "SAVE5", "GC50", userId: 1);

        Assert.True(result.IsSuccess);
        Assert.Equal(17.50m, result.Value!.GiftCardDiscount);
        Assert.Equal(0m, result.Value.FinalTotal);
    }

    [Fact]
    public async Task AccountCredit_NotAppliedUnlessRequested()
    {
        // Customer has £5 available credit but did not opt in — must not be deducted.
        var svc = Build(out var db, availableCredit: 5m);
        var item = await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(item.Id, 2)], "Delivery", null, null, userId: 1, useAccountCredit: false);

        Assert.True(result.IsSuccess);
        Assert.Equal(0m, result.Value!.CreditApplied);
        Assert.Equal(22.50m, result.Value.FinalTotal);
    }

    [Fact]
    public async Task AccountCredit_AppliedWhenRequested_NeverExceedsAmountOwed()
    {
        // £20 items + £2.50 delivery = £22.50 owed; £5 credit reduces it to £17.50.
        var svc = Build(out var db, availableCredit: 5m);
        var item = await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(item.Id, 2)], "Delivery", null, null, userId: 1, useAccountCredit: true);

        Assert.True(result.IsSuccess);
        Assert.Equal(5m, result.Value!.CreditApplied);
        Assert.Equal(17.50m, result.Value.FinalTotal);
    }

    [Fact]
    public async Task AccountCredit_CannotMakeTotalNegative()
    {
        // £20 items, Collection (no delivery fee) = £20 owed; £50 credit can only cover £20.
        var svc = Build(out var db, availableCredit: 50m);
        var item = await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(item.Id, 2)], "Collection", null, null, userId: 1, useAccountCredit: true);

        Assert.True(result.IsSuccess);
        Assert.Equal(20m, result.Value!.CreditApplied);
        Assert.Equal(0m, result.Value.FinalTotal);
    }

    [Fact]
    public async Task UnavailableItem_FailsValidation()
    {
        var svc = Build(out var db);
        await SeedItemAsync(db, price: 10m);

        var result = await svc.CalculateAsync(1, [new(999, 1)], "Delivery", null, null, userId: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.ValidationFailed, result.Error);
    }
}

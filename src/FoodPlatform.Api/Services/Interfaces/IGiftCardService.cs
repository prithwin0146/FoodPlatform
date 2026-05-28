using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Gift card purchase, validation, and redemption.
/// (SRP: gift card lifecycle only — payment intent creation delegated to IStripeService)
/// </summary>
public interface IGiftCardService
{
    Task<ValidateGiftCardResponse> ValidateAsync(string code);

    /// <summary>Purchases a gift card and returns it with a Stripe client secret if payment is needed.</summary>
    Task<PurchaseGiftCardResponse> PurchaseAsync(PurchaseGiftCardRequest request, int userId);

    /// <summary>Redeems up to amountToRedeem from the gift card balance. Returns actual amount redeemed.</summary>
    Task<decimal> RedeemAsync(string code, decimal amountToRedeem, int orderId);

    Task<IEnumerable<GiftCardDto>> GetAllAsync();

    Task<GiftCardDto?> GetByCodeAsync(string code);
}

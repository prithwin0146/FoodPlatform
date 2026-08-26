using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Free loyalty program (SeeThePrep Rewards) — stamps earned per completed order,
/// redeemable for account credit. Separate from the paid Plus subscription.
/// (SRP: earn/redeem business rules only — pricing application lives in IOrderPricingService)
/// </summary>
public interface ILoyaltyService
{
    /// <summary>Current stamp/credit status for a customer, creating an account on first access.</summary>
    Task<LoyaltyStatusDto> GetStatusAsync(int userId);

    /// <summary>Awards one stamp for a completed order. Idempotent per orderId.</summary>
    Task EarnStampAsync(int userId, int orderId);

    /// <summary>
    /// Converts a full stamp card into account credit (e.g. £5 credit per 9 stamps).
    /// Fails if the customer doesn't yet have enough stamps.
    /// </summary>
    Task<RedeemStampRewardResponse> RedeemStampRewardAsync(int userId);

    /// <summary>Current redeemable account credit balance — used by pricing to auto-apply at checkout.</summary>
    Task<decimal> GetAvailableCreditAsync(int userId);

    /// <summary>Deducts up to `amount` of account credit after it has been applied to an order.</summary>
    Task ConsumeCreditAsync(int userId, decimal amount, int orderId);
}

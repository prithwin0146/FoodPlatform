namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Free loyalty account for a customer — Just Eat Rewards style: stamps + account credit.
/// Distinct from SeeThePrep Plus (paid subscription); this is a zero-cost retention layer.
/// (SRP: balance/state only — earn/redeem business rules live in ILoyaltyService)
/// </summary>
public class LoyaltyAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }

    /// <summary>Stamps earned toward the next free-item reward. Resets to 0 on redemption.</summary>
    public int StampCount { get; set; }

    /// <summary>Number of stamps required to unlock a reward (e.g. a free item / £ credit).</summary>
    public int StampsRequiredForReward { get; set; } = 9;

    /// <summary>Redeemable account credit balance (£), from stamp rewards, promos, or referrals.</summary>
    public decimal AccountCreditBalance { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<LoyaltyTransaction> Transactions { get; set; } = [];
}

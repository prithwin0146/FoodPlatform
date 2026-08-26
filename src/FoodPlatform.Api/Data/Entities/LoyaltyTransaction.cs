namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Audit trail of every stamp/credit earn or redemption — powers the customer-facing
/// activity list and lets support/finance reconcile balances.
/// </summary>
public class LoyaltyTransaction
{
    public int Id { get; set; }
    public int LoyaltyAccountId { get; set; }

    /// <summary>EarnStamp | RedeemStampReward | EarnCredit | RedeemCredit.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Stamps or £ amount affected by this transaction (positive = earned, negative = redeemed).</summary>
    public decimal Amount { get; set; }

    public int? OrderId { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public LoyaltyAccount LoyaltyAccount { get; set; } = null!;
}

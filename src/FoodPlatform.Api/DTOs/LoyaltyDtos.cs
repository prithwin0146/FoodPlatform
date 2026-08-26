namespace FoodPlatform.Api.DTOs;

public record LoyaltyStatusDto(
    int StampCount,
    int StampsRequiredForReward,
    decimal AccountCreditBalance,
    IReadOnlyList<LoyaltyTransactionDto> RecentTransactions);

public record LoyaltyTransactionDto(
    int Id,
    string Type,
    decimal Amount,
    int? OrderId,
    string? Note,
    DateTime CreatedAt);

/// <summary>Result of redeeming a completed stamp card for a reward.</summary>
public record RedeemStampRewardResponse(
    bool Success,
    string Message,
    decimal CreditAwarded,
    decimal NewAccountCreditBalance);

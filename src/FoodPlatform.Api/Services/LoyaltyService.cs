using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Free loyalty program (SeeThePrep Rewards): stamps per order, redeemable for account credit.
/// (SRP: loyalty balance/earn/redeem logic only)
/// (DIP: controllers depend on ILoyaltyService, not DbContext)
/// </summary>
public class LoyaltyService : ILoyaltyService
{
    /// <summary>£ credit awarded when a full stamp card (9 stamps) is redeemed.</summary>
    private const decimal RewardCreditAmount = 5.00m;

    private readonly FoodPlatformDbContext _db;

    public LoyaltyService(FoodPlatformDbContext db)
    {
        _db = db;
    }

    public async Task<LoyaltyStatusDto> GetStatusAsync(int userId)
    {
        var account = await GetOrCreateAccountAsync(userId);
        var recent = await _db.LoyaltyTransactions
            .Where(t => t.LoyaltyAccountId == account.Id)
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(t => new LoyaltyTransactionDto(t.Id, t.Type, t.Amount, t.OrderId, t.Note, t.CreatedAt))
            .ToListAsync();

        return new LoyaltyStatusDto(account.StampCount, account.StampsRequiredForReward, account.AccountCreditBalance, recent);
    }

    public async Task EarnStampAsync(int userId, int orderId)
    {
        // Idempotency: never double-award a stamp for the same order (e.g. re-triggered webhook).
        var alreadyEarned = await _db.LoyaltyTransactions
            .AnyAsync(t => t.OrderId == orderId && t.Type == "EarnStamp");
        if (alreadyEarned) return;

        var account = await GetOrCreateAccountAsync(userId);
        account.StampCount += 1;
        account.UpdatedAt = DateTime.UtcNow;

        _db.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            Type = "EarnStamp",
            Amount = 1,
            OrderId = orderId,
            Note = "Stamp earned for completed order",
        });

        await _db.SaveChangesAsync();
    }

    public async Task<RedeemStampRewardResponse> RedeemStampRewardAsync(int userId)
    {
        var account = await GetOrCreateAccountAsync(userId);
        if (account.StampCount < account.StampsRequiredForReward)
            return new RedeemStampRewardResponse(false,
                $"You need {account.StampsRequiredForReward - account.StampCount} more stamp(s) to redeem a reward.",
                0m, account.AccountCreditBalance);

        account.StampCount -= account.StampsRequiredForReward;
        account.AccountCreditBalance += RewardCreditAmount;
        account.UpdatedAt = DateTime.UtcNow;

        _db.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            Type = "RedeemStampReward",
            Amount = -account.StampsRequiredForReward,
            Note = $"Redeemed full stamp card for £{RewardCreditAmount:0.00} credit",
        });
        _db.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            Type = "EarnCredit",
            Amount = RewardCreditAmount,
            Note = "Stamp card reward",
        });

        await _db.SaveChangesAsync();

        return new RedeemStampRewardResponse(true,
            $"🎉 Reward redeemed! £{RewardCreditAmount:0.00} credit added to your account.",
            RewardCreditAmount, account.AccountCreditBalance);
    }

    public async Task<decimal> GetAvailableCreditAsync(int userId)
    {
        var account = await _db.LoyaltyAccounts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == userId);
        return account?.AccountCreditBalance ?? 0m;
    }

    public async Task ConsumeCreditAsync(int userId, decimal amount, int orderId)
    {
        if (amount <= 0) return;
        var account = await _db.LoyaltyAccounts.FirstOrDefaultAsync(a => a.UserId == userId);
        if (account is null) return;

        var consumed = Math.Min(amount, account.AccountCreditBalance);
        if (consumed <= 0) return;

        account.AccountCreditBalance -= consumed;
        account.UpdatedAt = DateTime.UtcNow;

        _db.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            Type = "RedeemCredit",
            Amount = -consumed,
            OrderId = orderId,
            Note = "Applied at checkout",
        });

        await _db.SaveChangesAsync();
    }

    private async Task<LoyaltyAccount> GetOrCreateAccountAsync(int userId)
    {
        var account = await _db.LoyaltyAccounts.FirstOrDefaultAsync(a => a.UserId == userId);
        if (account is not null) return account;

        account = new LoyaltyAccount { UserId = userId };
        _db.LoyaltyAccounts.Add(account);
        await _db.SaveChangesAsync();
        return account;
    }
}

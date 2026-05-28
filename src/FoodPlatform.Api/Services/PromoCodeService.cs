using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Platform-wide promo code logic: validation, CRUD for admin, usage recording.
/// (SRP: promo code concern only — no order or payment logic)
/// (DIP: depends on FoodPlatformDbContext via injection)
/// </summary>
public class PromoCodeService : IPromoCodeService
{
    private readonly FoodPlatformDbContext _db;
    public PromoCodeService(FoodPlatformDbContext db) => _db = db;

    public async Task<ValidatePromoCodeResponse> ValidateAsync(string code, decimal orderTotal, int userId)
    {
        var promo = await _db.PromoCodes
            .FirstOrDefaultAsync(p => p.Code.ToLower() == code.ToLower() && p.IsActive);

        if (promo is null)
            return new ValidatePromoCodeResponse(false, "Promo code not found or inactive.", null, null, null);

        if (promo.ExpiresAt.HasValue && promo.ExpiresAt.Value < DateTime.UtcNow)
            return new ValidatePromoCodeResponse(false, "This promo code has expired.", null, null, null);

        if (promo.MaxUses.HasValue && promo.UsedCount >= promo.MaxUses.Value)
            return new ValidatePromoCodeResponse(false, "This promo code has reached its maximum uses.", null, null, null);

        if (promo.MinOrderAmount.HasValue && orderTotal < promo.MinOrderAmount.Value)
            return new ValidatePromoCodeResponse(false,
                $"Minimum order of £{promo.MinOrderAmount.Value:F2} required for this code.", null, null, null);

        // Check if user has already used this code
        var alreadyUsed = await _db.PromoCodeUsages.AnyAsync(u => u.UserId == userId && u.PromoCodeId == promo.Id);
        if (alreadyUsed)
            return new ValidatePromoCodeResponse(false, "You have already used this promo code.", null, null, null);

        var discountAmount = promo.DiscountType == "Percentage"
            ? Math.Round(orderTotal * (promo.DiscountValue / 100m), 2)
            : Math.Min(promo.DiscountValue, orderTotal);

        return new ValidatePromoCodeResponse(
            true,
            $"Code applied: {(promo.DiscountType == "Percentage" ? $"{promo.DiscountValue}% off" : $"£{promo.DiscountValue:F2} off")}",
            promo.DiscountType,
            promo.DiscountValue,
            discountAmount);
    }

    public async Task<IEnumerable<PromoCodeDto>> GetAllAsync() =>
        await _db.PromoCodes.OrderByDescending(p => p.CreatedAt).Select(p => ToDto(p)).ToListAsync();

    public async Task<PromoCodeDto?> GetByIdAsync(int id)
    {
        var p = await _db.PromoCodes.FindAsync(id);
        return p is null ? null : ToDto(p);
    }

    public async Task<PromoCodeDto> CreateAsync(CreatePromoCodeRequest request)
    {
        var code = new PromoCode
        {
            Code = request.Code.ToUpperInvariant().Trim(),
            Description = request.Description,
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            MinOrderAmount = request.MinOrderAmount,
            MaxUses = request.MaxUses,
            ExpiresAt = request.ExpiresAt,
        };
        _db.PromoCodes.Add(code);
        await _db.SaveChangesAsync();
        return ToDto(code);
    }

    public async Task<PromoCodeDto?> UpdateAsync(int id, UpdatePromoCodeRequest request)
    {
        var code = await _db.PromoCodes.FindAsync(id);
        if (code is null) return null;

        if (request.Description is not null) code.Description = request.Description;
        if (request.DiscountValue.HasValue) code.DiscountValue = request.DiscountValue.Value;
        if (request.MinOrderAmount.HasValue) code.MinOrderAmount = request.MinOrderAmount.Value;
        if (request.MaxUses.HasValue) code.MaxUses = request.MaxUses.Value;
        if (request.ExpiresAt.HasValue) code.ExpiresAt = request.ExpiresAt.Value;
        if (request.IsActive.HasValue) code.IsActive = request.IsActive.Value;

        await _db.SaveChangesAsync();
        return ToDto(code);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var code = await _db.PromoCodes.FindAsync(id);
        if (code is null) return false;
        _db.PromoCodes.Remove(code);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task RecordUsageAsync(int promoCodeId, int userId, int orderId, decimal discountApplied)
    {
        _db.PromoCodeUsages.Add(new PromoCodeUsage
        {
            PromoCodeId = promoCodeId,
            UserId = userId,
            OrderId = orderId,
            DiscountApplied = discountApplied,
        });
        var code = await _db.PromoCodes.FindAsync(promoCodeId);
        if (code is not null) code.UsedCount++;
        await _db.SaveChangesAsync();
    }

    private static PromoCodeDto ToDto(PromoCode p) => new(
        p.Id, p.Code, p.Description, p.DiscountType, p.DiscountValue,
        p.MinOrderAmount, p.MaxUses, p.UsedCount, p.ExpiresAt, p.IsActive, p.CreatedAt);
}

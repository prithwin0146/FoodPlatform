using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Platform-wide promo code validation and management.
/// (ISP: admin CRUD separated from customer-facing validate flow)
/// </summary>
public interface IPromoCodeService
{
    /// <summary>Validates a promo code for a given order total. Returns discount amount if valid.</summary>
    Task<ValidatePromoCodeResponse> ValidateAsync(string code, decimal orderTotal, int userId);

    /// <summary>Returns all promo codes for admin management.</summary>
    Task<IEnumerable<PromoCodeDto>> GetAllAsync();

    Task<PromoCodeDto?> GetByIdAsync(int id);

    Task<PromoCodeDto> CreateAsync(CreatePromoCodeRequest request);

    Task<PromoCodeDto?> UpdateAsync(int id, UpdatePromoCodeRequest request);

    Task<bool> DeleteAsync(int id);

    /// <summary>Atomically increments UsedCount and records a PromoCodeUsage row. Called inside PlaceOrderAsync.</summary>
    Task RecordUsageAsync(int promoCodeId, int userId, int orderId, decimal discountApplied);
}

using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// ── Promo Codes ────────────────────────────────────────────────────────────────

public record PromoCodeDto(
    int Id,
    string Code,
    string Description,
    string DiscountType,
    decimal DiscountValue,
    decimal? MinOrderAmount,
    int? MaxUses,
    int UsedCount,
    DateTime? ExpiresAt,
    bool IsActive,
    DateTime CreatedAt);

public record ValidatePromoCodeRequest(
    [Required, MaxLength(50)] string Code,
    decimal OrderTotal);

public record ValidatePromoCodeResponse(
    bool IsValid,
    string Message,
    string? DiscountType,
    decimal? DiscountValue,
    decimal? DiscountAmount);

public record CreatePromoCodeRequest(
    [Required, MaxLength(50)] string Code,
    [Required, MaxLength(500)] string Description,
    [Required] string DiscountType,  // Percentage | Fixed
    [Range(0.01, 100)] decimal DiscountValue,
    decimal? MinOrderAmount,
    int? MaxUses,
    DateTime? ExpiresAt);

public record UpdatePromoCodeRequest(
    string? Description,
    decimal? DiscountValue,
    decimal? MinOrderAmount,
    int? MaxUses,
    DateTime? ExpiresAt,
    bool? IsActive);

// ── Restaurant Promotions ──────────────────────────────────────────────────────

public record RestaurantPromotionDto(
    int Id,
    int RestaurantId,
    string Title,
    string? Description,
    string DiscountType,
    decimal DiscountValue,
    int? AppliesToCategoryId,
    string? AppliesToCategoryName,
    DateTime? StartsAt,
    DateTime? EndsAt,
    bool IsActive,
    DateTime CreatedAt);

public record CreateRestaurantPromotionRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(500)] string? Description,
    [Required] string DiscountType,   // PercentageOff | FixedOff
    [Range(0.01, 100)] decimal DiscountValue,
    int? AppliesToCategoryId,
    DateTime? StartsAt,
    DateTime? EndsAt);

public record UpdateRestaurantPromotionRequest(
    string? Title,
    string? Description,
    decimal? DiscountValue,
    int? AppliesToCategoryId,
    DateTime? StartsAt,
    DateTime? EndsAt,
    bool? IsActive);

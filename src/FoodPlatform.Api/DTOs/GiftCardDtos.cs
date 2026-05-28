using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// ── Gift Cards ─────────────────────────────────────────────────────────────────

public record GiftCardDto(
    int Id,
    string Code,
    decimal InitialAmount,
    decimal RemainingBalance,
    bool IsActive,
    DateTime CreatedAt);

public record PurchaseGiftCardRequest(
    [Range(5, 500, ErrorMessage = "Gift card value must be between £5 and £500")]
    decimal Amount,
    [Required] string IdempotencyKey,
    string? PaymentIntentId);

public record PurchaseGiftCardResponse(
    GiftCardDto GiftCard,
    /// <summary>Stripe client secret for confirming card payment (null in demo mode).</summary>
    string? ClientSecret);

public record ValidateGiftCardRequest(
    [Required, MaxLength(20)] string Code);

public record ValidateGiftCardResponse(
    bool IsValid,
    string Message,
    decimal? RemainingBalance);

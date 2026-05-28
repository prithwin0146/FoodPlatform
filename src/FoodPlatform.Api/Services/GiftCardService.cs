using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Gift card purchase, validation, and redemption.
/// (SRP: gift card lifecycle only — Stripe payment delegated to IStripeService)
/// (DIP: FoodPlatformDbContext injected; controllers depend on IGiftCardService)
/// </summary>
public class GiftCardService : IGiftCardService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IStripeService _stripe;

    public GiftCardService(FoodPlatformDbContext db, IStripeService stripe)
    {
        _db = db;
        _stripe = stripe;
    }

    public async Task<ValidateGiftCardResponse> ValidateAsync(string code)
    {
        var card = await _db.GiftCards
            .FirstOrDefaultAsync(g => g.Code.ToLower() == code.ToLower() && g.IsActive);

        if (card is null)
            return new ValidateGiftCardResponse(false, "Gift card not found or has been deactivated.", null);

        if (card.RemainingBalance <= 0)
            return new ValidateGiftCardResponse(false, "This gift card has no remaining balance.", null);

        return new ValidateGiftCardResponse(true, $"Gift card has £{card.RemainingBalance:F2} available.", card.RemainingBalance);
    }

    public async Task<PurchaseGiftCardResponse> PurchaseAsync(PurchaseGiftCardRequest request, int userId)
    {
        string? clientSecret = null;

        if (!string.IsNullOrEmpty(request.PaymentIntentId))
        {
            var paid = await _stripe.VerifyPaymentSucceededAsync(request.PaymentIntentId, request.Amount);
            if (!paid)
                throw new InvalidOperationException("Payment has not been confirmed.");
        }
        else
        {
            // Create a payment intent for the gift card amount
            var (secret, _) = await _stripe.CreatePaymentIntentAsync(request.Amount, request.IdempotencyKey);
            clientSecret = secret.StartsWith("pi_mock_") ? null : secret;
        }

        var card = new GiftCard
        {
            Code = GenerateCode(),
            InitialAmount = request.Amount,
            RemainingBalance = request.Amount,
            PurchasedByUserId = userId,
            StripePaymentIntentId = request.PaymentIntentId,
        };
        _db.GiftCards.Add(card);
        await _db.SaveChangesAsync();

        return new PurchaseGiftCardResponse(ToDto(card), clientSecret);
    }

    public async Task<decimal> RedeemAsync(string code, decimal amountToRedeem, int orderId)
    {
        var card = await _db.GiftCards
            .FirstOrDefaultAsync(g => g.Code.ToLower() == code.ToLower() && g.IsActive);
        if (card is null || card.RemainingBalance <= 0) return 0;

        var actual = Math.Min(amountToRedeem, card.RemainingBalance);
        card.RemainingBalance -= actual;
        if (card.RemainingBalance <= 0) card.IsActive = false;

        _db.GiftCardUsages.Add(new GiftCardUsage
        {
            GiftCardId = card.Id,
            OrderId = orderId,
            AmountUsed = actual,
        });
        await _db.SaveChangesAsync();
        return actual;
    }

    public async Task<IEnumerable<GiftCardDto>> GetAllAsync() =>
        await _db.GiftCards.OrderByDescending(g => g.CreatedAt).Select(g => ToDto(g)).ToListAsync();

    public async Task<GiftCardDto?> GetByCodeAsync(string code)
    {
        var card = await _db.GiftCards.FirstOrDefaultAsync(g => g.Code.ToLower() == code.ToLower());
        return card is null ? null : ToDto(card);
    }

    private static GiftCardDto ToDto(GiftCard g) =>
        new(g.Id, g.Code, g.InitialAmount, g.RemainingBalance, g.IsActive, g.CreatedAt);

    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        var rng = new Random();
        string Part() => new(Enumerable.Range(0, 4).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        return $"STP-{Part()}-{Part()}";
    }
}

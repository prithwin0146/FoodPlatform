using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Customer-facing gift card endpoints: purchase and validate.
/// (SRP: HTTP concerns only — business logic in IGiftCardService)
/// </summary>
[Route("api/gift-cards")]
[ApiController]
public class GiftCardsController(IGiftCardService giftCards) : RestaurantScopedController
{
    /// <summary>Check a gift card code's balance. No auth required (used at checkout).</summary>
    [HttpPost("validate")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Validate(ValidateGiftCardRequest request) =>
        Ok(await giftCards.ValidateAsync(request.Code));

    /// <summary>Purchase a new gift card.</summary>
    [HttpPost("purchase")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Purchase(PurchaseGiftCardRequest request)
    {
        try
        {
            var result = await giftCards.PurchaseAsync(request, CurrentUserId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

/// <summary>
/// Admin management of gift cards.
/// </summary>
[Route("api/admin/gift-cards")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminGiftCardsController(IGiftCardService giftCards) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await giftCards.GetAllAsync());

    [HttpGet("{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var dto = await giftCards.GetByCodeAsync(code);
        return dto is null ? NotFound() : Ok(dto);
    }
}

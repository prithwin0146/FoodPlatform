using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Customer-facing promo code validation endpoint.
/// (SRP: HTTP concerns only — business logic in IPromoCodeService)
/// </summary>
[Route("api/promo")]
[ApiController]
[Authorize(Roles = "Customer")]
public class PromoController(IPromoCodeService promos) : RestaurantScopedController
{
    [HttpPost("validate")]
    public async Task<IActionResult> Validate(ValidatePromoCodeRequest request)
    {
        var result = await promos.ValidateAsync(request.Code, request.OrderTotal, CurrentUserId);
        return Ok(result);
    }
}

using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Customer-facing free loyalty program (SeeThePrep Rewards) — stamps + account credit.
/// (SRP: HTTP concerns only — business logic in ILoyaltyService)
/// </summary>
[Route("api/loyalty")]
[ApiController]
[Authorize]
public class LoyaltyController(ILoyaltyService loyalty) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus() =>
        Ok(await loyalty.GetStatusAsync(CurrentUserId));

    [HttpPost("redeem-stamps")]
    public async Task<IActionResult> RedeemStamps()
    {
        var result = await loyalty.RedeemStampRewardAsync(CurrentUserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// SeeThePrep Plus subscription endpoints.
/// (SRP: HTTP concerns only — Stripe session creation + state in ISubscriptionService)
/// </summary>
[Route("api/subscriptions")]
[ApiController]
[Authorize(Roles = "Customer")]
public class SubscriptionsController(ISubscriptionService subscriptions) : RestaurantScopedController
{
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus() =>
        Ok(await subscriptions.GetStatusAsync(CurrentUserId));

    [HttpPost("create-checkout")]
    public async Task<IActionResult> CreateCheckout(CreateSubscriptionCheckoutRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                 ?? User.FindFirstValue("email")
                 ?? string.Empty;
        var result = await subscriptions.CreateCheckoutSessionAsync(CurrentUserId, email, request);
        return Ok(result);
    }

    [HttpDelete("cancel")]
    public async Task<IActionResult> Cancel()
    {
        var cancelled = await subscriptions.CancelAsync(CurrentUserId);
        return cancelled ? Ok(new { message = "Subscription cancelled" }) : NotFound();
    }
}

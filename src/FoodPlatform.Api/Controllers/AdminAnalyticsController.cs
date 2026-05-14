using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Admin analytics endpoints. (SRP: read-only analytics surface separate from mutation controllers)
/// (DIP: depends on IAdminAnalyticsService, not DbContext directly)
/// </summary>
[Route("api/admin/analytics")]
[Authorize(Roles = "Admin")]
[ApiController]
public class AdminAnalyticsController : ControllerBase
{
    private readonly IAdminAnalyticsService _analytics;

    public AdminAnalyticsController(IAdminAnalyticsService analytics) => _analytics = analytics;

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _analytics.GetAsync());
}

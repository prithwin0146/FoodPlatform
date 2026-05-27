using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Public (unauthenticated) endpoint to expose platform settings the frontend needs.
/// GET /api/settings — returns the settings dictionary for public consumption.
/// (SRP: read-only public settings exposure only)
/// </summary>
[ApiController]
[Route("api/settings")]
public class SettingsController(IPlatformSettingsService settings) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPublic()
    {
        var dict = await settings.GetPublicSettingsAsync();
        return Ok(dict);
    }
}

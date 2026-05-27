using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Admin-only endpoint to manage platform-wide settings.
/// GET /api/admin/settings — returns all settings (admin only for full view)
/// PUT /api/admin/settings/{key} — upserts a single setting
/// (SRP: controller maps HTTP → service; no business logic here)
/// (DIP: depends on IPlatformSettingsService)
/// </summary>
[ApiController]
[Route("api/admin/settings")]
[Authorize(Roles = "Admin")]
public class AdminSettingsController(IPlatformSettingsService settings) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var dict = await settings.GetPublicSettingsAsync();
        return Ok(dict);
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Upsert(string key, [FromBody] UpsertSettingRequest req)
    {
        if (string.IsNullOrWhiteSpace(key)) return BadRequest("Key is required.");
        await settings.UpsertSettingAsync(key.Trim().ToLower(), req.Value ?? string.Empty);
        return NoContent();
    }
}

/// <summary>Request DTO for upserting a setting value.</summary>
public record UpsertSettingRequest(string? Value);

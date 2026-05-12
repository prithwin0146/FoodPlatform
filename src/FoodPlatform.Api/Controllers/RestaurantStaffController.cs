using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Staff-facing restaurant management endpoints (non-admin).
/// (SRP: staff-only profile operations; admin CRUD lives in AdminRestaurantsController)
/// (DIP: depends on IRestaurantStaffService, not DbContext)
/// </summary>
[Route("api/restaurant")]
[Authorize(Roles = "Staff,Admin")]
public class RestaurantStaffController : RestaurantScopedController
{
    private readonly IRestaurantStaffService _staffService;

    public RestaurantStaffController(IRestaurantStaffService staffService) =>
        _staffService = staffService;

    /// <summary>Returns the authenticated staff member's restaurant profile.</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyRestaurant()
    {
        var dto = await _staffService.GetMyRestaurantAsync(CurrentRestaurantId);
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>
    /// Lets staff/admin update the kitchen video URL for their restaurant.
    /// Accepts YouTube embeds, Vimeo URLs, or direct MP4/WebM links.
    /// Send { "kitchenVideoUrl": "" } or { "kitchenVideoUrl": null } to clear.
    /// </summary>
    [HttpPatch("video")]
    public async Task<IActionResult> UpdateKitchenVideo(UpdateKitchenVideoRequest request)
    {
        var result = await _staffService.UpdateKitchenVideoAsync(CurrentRestaurantId, request.KitchenVideoUrl);
        if (!result.IsSuccess)
            return result.Error == OrderServiceError.NotFound
                ? NotFound(new { error = result.ErrorMessage })
                : BadRequest(new { error = result.ErrorMessage });

        return Ok(result.Value);
    }
}

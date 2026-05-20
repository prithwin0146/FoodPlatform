using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Public restaurant endpoints.
/// (DIP: depends on IRestaurantQueryService, not DbContext)
/// (SRP: postcode filtering logic lives in RestaurantQueryService)
/// </summary>
[Route("api/restaurants")]
[ApiController]
public class RestaurantsController : ControllerBase
{
    private readonly IRestaurantQueryService _restaurants;
    private readonly IAngelcamService _angelcam;

    public RestaurantsController(IRestaurantQueryService restaurants, IAngelcamService angelcam)
    {
        _restaurants = restaurants;
        _angelcam = angelcam;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? postcode) =>
        Ok(await _restaurants.ListActiveAsync(postcode));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await _restaurants.GetDetailAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Returns a fresh Angelcam HLS URL for the restaurant's live kitchen camera.
    /// No auth required — anyone browsing the menu can preview the stream.
    /// (SRP: Angelcam call delegated to IAngelcamService)
    /// </summary>
    [HttpGet("{id:int}/live-stream-url")]
    public async Task<IActionResult> GetLiveStreamUrl(int id)
    {
        var restaurant = await _restaurants.GetDetailAsync(id);
        if (restaurant is null)
            return NotFound();
        if (string.IsNullOrEmpty(restaurant.LiveStreamPlaybackId))
            return NotFound(new { error = "No camera configured for this restaurant" });

        var hlsUrl = await _angelcam.GetHlsUrlAsync(restaurant.LiveStreamPlaybackId);
        if (hlsUrl == null)
            return NotFound(new { error = "Stream is currently unavailable" });

        return Ok(new { hlsUrl });
    }
    [HttpGet("{id:int}/hours")]
    public async Task<IActionResult> GetHours(int id) =>
        Ok(await _restaurants.GetHoursAsync(id));

    [HttpGet("{id:int}/menu")]
    public async Task<IActionResult> GetMenu(int id) =>
        Ok(await _restaurants.GetMenuAsync(id));
}

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
    private readonly IHashIdService _hashIds;

    public RestaurantsController(IRestaurantQueryService restaurants, IAngelcamService angelcam, IHashIdService hashIds)
    {
        _restaurants = restaurants;
        _angelcam = angelcam;
        _hashIds = hashIds;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? postcode)
    {
        var list = await _restaurants.ListActiveAsync(postcode);
        return Ok(list.Select(r => r with { HashId = _hashIds.Encode(r.Id) }));
    }

    [HttpGet("{hash}")]
    public async Task<IActionResult> Get(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _restaurants.GetDetailAsync(id.Value);
        return result is null ? NotFound() : Ok(result with { HashId = hash });
    }

    /// <summary>
    /// Returns a fresh Angelcam HLS URL for the restaurant's live kitchen camera.
    /// No auth required — anyone browsing the menu can preview the stream.
    /// (SRP: Angelcam call delegated to IAngelcamService)
    /// </summary>
    [HttpGet("{hash}/live-stream-url")]
    public async Task<IActionResult> GetLiveStreamUrl(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var restaurant = await _restaurants.GetDetailAsync(id.Value);
        if (restaurant is null)
            return NotFound();
        if (string.IsNullOrEmpty(restaurant.AngelcamCameraId))
            return NotFound(new { error = "No camera configured for this restaurant" });

        var hlsUrl = await _angelcam.GetHlsUrlAsync(restaurant.AngelcamCameraId);
        if (hlsUrl == null)
            return NotFound(new { error = "Stream is currently unavailable" });

        return Ok(new { hlsUrl });
    }

    [HttpGet("{hash}/hours")]
    public async Task<IActionResult> GetHours(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        return Ok(await _restaurants.GetHoursAsync(id.Value));
    }

    [HttpGet("{hash}/menu")]
    public async Task<IActionResult> GetMenu(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        return Ok(await _restaurants.GetMenuAsync(id.Value));
    }
}


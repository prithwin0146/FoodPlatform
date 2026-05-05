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

    public RestaurantsController(IRestaurantQueryService restaurants) =>
        _restaurants = restaurants;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? postcode) =>
        Ok(await _restaurants.ListActiveAsync(postcode));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await _restaurants.GetDetailAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:int}/hours")]
    public async Task<IActionResult> GetHours(int id) =>
        Ok(await _restaurants.GetHoursAsync(id));

    [HttpGet("{id:int}/menu")]
    public async Task<IActionResult> GetMenu(int id) =>
        Ok(await _restaurants.GetMenuAsync(id));
}

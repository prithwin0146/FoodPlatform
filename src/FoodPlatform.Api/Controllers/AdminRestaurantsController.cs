using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Admin restaurant operations. (SRP: split from AdminOrdersController)
/// (DIP: depends on IAdminRestaurantService interface, not DbContext)
/// </summary>
[Route("api/admin/restaurants")]
[Authorize(Roles = "Admin")]
[ApiController]
public class AdminRestaurantsController : ControllerBase
{
    private readonly IAdminRestaurantService _restaurants;

    public AdminRestaurantsController(IAdminRestaurantService restaurants) =>
        _restaurants = restaurants;

    [HttpGet]
    public async Task<IActionResult> AllRestaurants() =>
        Ok(await _restaurants.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create(CreateRestaurantRequest request) =>
        Ok(await _restaurants.CreateAsync(request));

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateRestaurantRequest request)
    {
        var result = await _restaurants.UpdateAsync(id, request);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("{id:int}/activate")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var result = await _restaurants.ToggleActiveAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _restaurants.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}

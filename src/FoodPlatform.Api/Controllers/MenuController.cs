using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// (DIP: depends on IMenuService, not DbContext)
/// (SRP: ownership checks and persistence live in MenuService)
/// </summary>
[Route("api/menu")]
[Authorize(Roles = "Staff,Admin")]
public class MenuController : RestaurantScopedController
{
    private readonly IMenuService _menu;

    public MenuController(IMenuService menu) => _menu = menu;

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory(CreateCategoryRequest request) =>
        Ok(await _menu.CreateCategoryAsync(CurrentRestaurantId, request));

    [HttpPost("items")]
    public async Task<IActionResult> CreateItem(CreateMenuItemRequest request)
    {
        var result = await _menu.CreateItemAsync(CurrentRestaurantId, request);
        return result is null ? Unauthorized() : Ok(result);
    }

    [HttpPatch("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, UpdateMenuItemRequest request)
    {
        var result = await _menu.UpdateItemAsync(CurrentRestaurantId, id, request);
        return result is null ? Unauthorized() : Ok(result);
    }

    [HttpPatch("items/{id:int}/availability")]
    public async Task<IActionResult> ToggleAvailability(int id)
    {
        var result = await _menu.ToggleAvailabilityAsync(CurrentRestaurantId, id);
        return result is null ? Unauthorized() : Ok(result);
    }
}

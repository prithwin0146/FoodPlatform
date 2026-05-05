using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>Admin-only controller for cross-restaurant menu management. (SRP: thin HTTP layer)</summary>
[ApiController]
[Route("api/admin/menu")]
[Authorize(Roles = "Admin")]
public class AdminMenuController : ControllerBase
{
    private readonly IAdminMenuService _menu;
    public AdminMenuController(IAdminMenuService menu) => _menu = menu;

    [HttpGet("restaurants/{restaurantId:int}")]
    public async Task<IActionResult> GetMenu(int restaurantId) =>
        Ok(await _menu.GetMenuAsync(restaurantId));

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] AdminCreateCategoryRequest request)
    {
        var cat = await _menu.CreateCategoryAsync(request);
        return CreatedAtAction(nameof(GetMenu), new { restaurantId = request.RestaurantId }, cat);
    }

    [HttpDelete("categories/{categoryId:int}")]
    public async Task<IActionResult> DeleteCategory(int categoryId)
    {
        var ok = await _menu.DeleteCategoryAsync(categoryId);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("items")]
    public async Task<IActionResult> CreateItem([FromBody] AdminCreateMenuItemRequest request)
    {
        var item = await _menu.CreateItemAsync(request);
        return CreatedAtAction(nameof(GetMenu), new { restaurantId = request.RestaurantId }, item);
    }

    [HttpPatch("items/{itemId:int}")]
    public async Task<IActionResult> UpdateItem(int itemId, [FromBody] AdminUpdateMenuItemRequest request)
    {
        var item = await _menu.UpdateItemAsync(itemId, request);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("items/{itemId:int}")]
    public async Task<IActionResult> DeleteItem(int itemId)
    {
        var ok = await _menu.DeleteItemAsync(itemId);
        return ok ? NoContent() : NotFound();
    }
}

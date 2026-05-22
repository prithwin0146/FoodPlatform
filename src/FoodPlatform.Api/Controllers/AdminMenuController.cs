using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>Admin-only controller for cross-restaurant menu management. (SRP: thin HTTP layer)
/// (DIP: depends on IAdminMenuService and IUrlEncryptionService abstractions)</summary>
[ApiController]
[Route("api/admin/menu")]
[Authorize(Roles = "Admin")]
public class AdminMenuController : ControllerBase
{
    private readonly IAdminMenuService _menu;
    private readonly IUrlEncryptionService _urlEncryption;

    public AdminMenuController(IAdminMenuService menu, IUrlEncryptionService urlEncryption)
    {
        _menu = menu;
        _urlEncryption = urlEncryption;
    }

    [HttpGet("restaurants/{restaurantHash}")]
    public async Task<IActionResult> GetMenu(string restaurantHash)
    {
        var id = _urlEncryption.Decrypt(restaurantHash);
        if (id is null) return BadRequest("Invalid restaurant identifier.");
        return Ok(await _menu.GetMenuAsync(id.Value));
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] AdminCreateCategoryRequest request)
    {
        var cat = await _menu.CreateCategoryAsync(request);
        return CreatedAtAction(nameof(GetMenu), new { restaurantHash = _urlEncryption.Encrypt(request.RestaurantId) }, cat);
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
        return CreatedAtAction(nameof(GetMenu), new { restaurantHash = _urlEncryption.Encrypt(request.RestaurantId) }, item);
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

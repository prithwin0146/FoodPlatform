using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Exposes per-item stock management for restaurant staff.
/// (SRP: inventory HTTP surface only — no menu CRUD, no ordering)
/// (DIP: delegates entirely to IInventoryService)
/// </summary>
[ApiController]
[Route("api/restaurant/inventory")]
[Authorize(Roles = "Staff,Admin")]
public class InventoryController : RestaurantScopedController
{
    private readonly IInventoryService _inventory;

    public InventoryController(IInventoryService inventory) => _inventory = inventory;

    /// <summary>Returns all menu items with their current stock state for this restaurant.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _inventory.GetAllAsync(CurrentRestaurantId));

    /// <summary>Sets TrackStock + StockCount for a specific menu item. Auto-disables item when count reaches 0.</summary>
    [HttpPut("{itemId:int}")]
    public async Task<IActionResult> SetStock(int itemId, [FromBody] SetStockRequest request)
    {
        var result = await _inventory.SetStockAsync(CurrentRestaurantId, itemId, request);
        return result is null ? NotFound() : Ok(result);
    }
}

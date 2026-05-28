using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Handles bulk CSV menu import for restaurant staff and platform admins.
/// (SRP: HTTP surface for import only — parsing and persistence are in IMenuImportService)
/// (DIP: depends on abstraction IMenuImportService, not the concrete class)
/// </summary>
[ApiController]
public class MenuImportController : RestaurantScopedController
{
    private readonly IMenuImportService _import;

    public MenuImportController(IMenuImportService import) => _import = import;

    /// <summary>
    /// Staff: import a CSV into the currently authenticated staff member's restaurant.
    /// CSV must contain columns: CategoryName, Name, Price. Optional: Description, Allergens, DietaryTags, ImageUrl
    /// </summary>
    [HttpPost("api/restaurant/menu/import")]
    [Authorize(Roles = "Staff,Admin")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB
    public async Task<IActionResult> ImportForCurrentRestaurant(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided");
        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest("File must be a .csv");

        await using var stream = file.OpenReadStream();
        var result = await _import.ImportAsync(CurrentRestaurantId, stream);
        return Ok(result);
    }

    /// <summary>
    /// Admin: import a CSV into any restaurant by restaurantId query param.
    /// </summary>
    [HttpPost("api/admin/menu/import/{restaurantId:int}")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> ImportForRestaurant(int restaurantId, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided");
        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest("File must be a .csv");

        await using var stream = file.OpenReadStream();
        var result = await _import.ImportAsync(restaurantId, stream);
        return Ok(result);
    }
}

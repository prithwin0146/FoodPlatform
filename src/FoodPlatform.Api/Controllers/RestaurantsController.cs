using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Controllers;

[Route("api/restaurants")]
[ApiController]
public class RestaurantsController : ControllerBase
{
    private readonly FoodPlatformDbContext _db;

    public RestaurantsController(FoodPlatformDbContext db) => _db = db;

    /// <summary>Public: list active restaurants, optionally filtered by customer postcode</summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? postcode)
    {
        var query = _db.Restaurants.Where(r => r.IsActive);

        // TODO: if postcode supplied, filter by delivery radius (Phase 1 — return all for now)
        var restaurants = await query
            .Select(r => new RestaurantDto(r.Id, r.Name, r.Address, r.BasePostcode,
                r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive))
            .ToListAsync();

        return Ok(restaurants);
    }

    /// <summary>Public: single restaurant detail with hours</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var r = await _db.Restaurants
            .Include(r => r.Hours)
            .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

        if (r == null) return NotFound();

        var dto = new RestaurantDetailDto(r.Id, r.Name, r.Address, r.BasePostcode,
            r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive,
            r.Hours.Select(h => new RestaurantHoursDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed)).ToList());

        return Ok(dto);
    }

    /// <summary>Public: opening hours for a restaurant</summary>
    [HttpGet("{id:int}/hours")]
    public async Task<IActionResult> GetHours(int id)
    {
        var hours = await _db.RestaurantHours
            .Where(h => h.RestaurantId == id)
            .Select(h => new RestaurantHoursDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed))
            .ToListAsync();

        return Ok(hours);
    }

    /// <summary>Public: get full menu with categories for a restaurant</summary>
    [HttpGet("{id:int}/menu")]
    public async Task<IActionResult> GetMenu(int id)
    {
        var categories = await _db.MenuCategories
            .Where(c => c.RestaurantId == id)
            .OrderBy(c => c.SortOrder)
            .Select(c => new MenuCategoryDto(
                c.Id, c.Name, c.SortOrder,
                c.Items.Where(i => i.IsAvailable)
                    .Select(i => new MenuItemDto(i.Id, i.CategoryId, i.Name, i.Description,
                        i.Price, i.Allergens, i.DietaryTags, i.IsAvailable))
                    .ToList()))
            .ToListAsync();

        return Ok(categories);
    }
}

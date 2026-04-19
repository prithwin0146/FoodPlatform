using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Controllers;

[Route("api/menu")]
[Authorize(Roles = "Staff,Admin")]
public class MenuController : RestaurantScopedController
{
    private readonly FoodPlatformDbContext _db;
    public MenuController(FoodPlatformDbContext db) => _db = db;

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory(CreateCategoryRequest request)
    {
        var category = new MenuCategory
        {
            RestaurantId = CurrentRestaurantId,
            Name = request.Name,
            SortOrder = request.SortOrder
        };
        _db.MenuCategories.Add(category);
        await _db.SaveChangesAsync();
        return Ok(new MenuCategoryDto(category.Id, category.Name, category.SortOrder, []));
    }

    [HttpPost("items")]
    public async Task<IActionResult> CreateItem(CreateMenuItemRequest request)
    {
        // Verify category belongs to this restaurant
        var category = await _db.MenuCategories.FindAsync(request.CategoryId);
        if (category == null || category.RestaurantId != CurrentRestaurantId)
            return Unauthorized();

        var item = new MenuItem
        {
            RestaurantId = CurrentRestaurantId,
            CategoryId = request.CategoryId,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Allergens = request.Allergens,
            DietaryTags = request.DietaryTags
        };
        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new MenuItemDto(item.Id, item.CategoryId, item.Name, item.Description,
            item.Price, item.Allergens, item.DietaryTags, item.IsAvailable));
    }

    [HttpPatch("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, UpdateMenuItemRequest request)
    {
        var item = await _db.MenuItems.FindAsync(id);
        if (item == null || item.RestaurantId != CurrentRestaurantId)
            return Unauthorized();

        if (request.Name != null) item.Name = request.Name;
        if (request.Description != null) item.Description = request.Description;
        if (request.Price.HasValue) item.Price = request.Price.Value;
        if (request.Allergens != null) item.Allergens = request.Allergens;
        if (request.DietaryTags != null) item.DietaryTags = request.DietaryTags;
        if (request.CategoryId.HasValue) item.CategoryId = request.CategoryId.Value;

        await _db.SaveChangesAsync();
        return Ok(new MenuItemDto(item.Id, item.CategoryId, item.Name, item.Description,
            item.Price, item.Allergens, item.DietaryTags, item.IsAvailable));
    }

    [HttpPatch("items/{id:int}/availability")]
    public async Task<IActionResult> ToggleAvailability(int id)
    {
        var item = await _db.MenuItems.FindAsync(id);
        if (item == null || item.RestaurantId != CurrentRestaurantId)
            return Unauthorized();

        item.IsAvailable = !item.IsAvailable;
        await _db.SaveChangesAsync();
        return Ok(new { item.Id, item.IsAvailable });
    }
}

using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Menu management: category and item CRUD, availability toggling.
/// (SRP: all menu business logic in one place; controllers delegate here)
/// (DIP: controllers depend on IMenuService, not DbContext)
/// </summary>
public class MenuService : IMenuService
{
    private readonly FoodPlatformDbContext _db;

    public MenuService(FoodPlatformDbContext db) => _db = db;

    public async Task<MenuCategoryDto> CreateCategoryAsync(int restaurantId, CreateCategoryRequest request)
    {
        var category = new MenuCategory
        {
            RestaurantId = restaurantId,
            Name = request.Name,
            SortOrder = request.SortOrder
        };
        _db.MenuCategories.Add(category);
        await _db.SaveChangesAsync();
        return new MenuCategoryDto(category.Id, category.Name, category.SortOrder, []);
    }

    public async Task<MenuItemDto?> CreateItemAsync(int restaurantId, CreateMenuItemRequest request)
    {
        // Ownership check belongs in the service, not the controller
        var category = await _db.MenuCategories.FindAsync(request.CategoryId);
        if (category == null || category.RestaurantId != restaurantId)
            return null;

        var item = new MenuItem
        {
            RestaurantId = restaurantId,
            CategoryId = request.CategoryId,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Allergens = request.Allergens,
            DietaryTags = request.DietaryTags,
            ImageUrl = request.ImageUrl
        };
        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();

        return new MenuItemDto(item.Id, item.CategoryId, item.Name, item.Description,
            item.Price, item.Allergens, item.DietaryTags, item.IsAvailable, item.ImageUrl);
    }

    public async Task<MenuItemDto?> UpdateItemAsync(int restaurantId, int itemId, UpdateMenuItemRequest request)
    {
        var item = await _db.MenuItems.FindAsync(itemId);
        if (item == null || item.RestaurantId != restaurantId)
            return null;

        if (request.Name != null) item.Name = request.Name;
        if (request.Description != null) item.Description = request.Description;
        if (request.Price.HasValue) item.Price = request.Price.Value;
        if (request.Allergens != null) item.Allergens = request.Allergens;
        if (request.DietaryTags != null) item.DietaryTags = request.DietaryTags;
        if (request.CategoryId.HasValue)
        {
            // Ownership check: the target category must belong to the same restaurant.
            // Without this, a malicious staff member could move items into another restaurant's category.
            var targetCategory = await _db.MenuCategories.FindAsync(request.CategoryId.Value);
            if (targetCategory == null || targetCategory.RestaurantId != restaurantId)
                return null;
            item.CategoryId = request.CategoryId.Value;
        }
        if (request.ImageUrl != null) item.ImageUrl = request.ImageUrl;
        if (request.IsAvailable.HasValue) item.IsAvailable = request.IsAvailable.Value;

        await _db.SaveChangesAsync();
        return new MenuItemDto(item.Id, item.CategoryId, item.Name, item.Description,
            item.Price, item.Allergens, item.DietaryTags, item.IsAvailable, item.ImageUrl);
    }

    public async Task<object?> ToggleAvailabilityAsync(int restaurantId, int itemId)
    {
        var item = await _db.MenuItems.FindAsync(itemId);
        if (item == null || item.RestaurantId != restaurantId)
            return null;

        item.IsAvailable = !item.IsAvailable;
        await _db.SaveChangesAsync();
        return new { item.Id, item.IsAvailable };
    }

    /// <summary>
    /// Soft-deletes a menu item so it never appears in menus or orders again,
    /// but order history referencing it is preserved. (OCP: new deletion strategy without changing order queries)
    /// </summary>
    public async Task<bool> DeleteItemAsync(int restaurantId, int itemId)
    {
        var item = await _db.MenuItems.FindAsync(itemId);
        if (item == null || item.RestaurantId != restaurantId)
            return false;

        item.IsDeleted = true;
        item.IsAvailable = false; // belt-and-suspenders: also mark unavailable
        await _db.SaveChangesAsync();
        return true;
    }}
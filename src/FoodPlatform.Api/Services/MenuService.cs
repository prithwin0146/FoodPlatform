using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using FoodPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Menu management: category and item CRUD, availability toggling.
/// (SRP: all menu business logic in one place; controllers delegate here)
/// (DIP: controllers depend on IMenuService, not DbContext)
/// </summary>
public class MenuService : IMenuService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IMemoryCacheService _cache;

    public MenuService(FoodPlatformDbContext db, IMemoryCacheService cache)
{
    _db = db;
    _cache = cache;
}

    public async Task<bool> DeleteCategoryAsync(int restaurantId, int categoryId)
    {
        var category = await _db.MenuCategories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == categoryId && c.RestaurantId == restaurantId);
        if (category is null) return false;

        // Soft-delete all items first so order history is preserved
        foreach (var item in category.Items)
        {
            item.IsDeleted = true;
            item.IsAvailable = false;
        }
        _db.MenuCategories.Remove(category);
        await _db.SaveChangesAsync();
        _cache.Remove($"menu-restaurant-{restaurantId}");
        return true;
    }

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
        _cache.Remove($"menu-restaurant-{restaurantId}");
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
            Allergens = Infrastructure.JsonStringList.Serialize(request.Allergens),
            DietaryTags = Infrastructure.JsonStringList.Serialize(request.DietaryTags),
            ImageUrl = request.ImageUrl
        };
        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();
        _cache.Remove($"menu-restaurant-{restaurantId}");

        return new MenuItemDto(item.Id, item.CategoryId, item.Name, item.Description,
            item.Price,
            Infrastructure.JsonStringList.Parse(item.Allergens),
            Infrastructure.JsonStringList.Parse(item.DietaryTags),
            item.IsAvailable, item.ImageUrl, item.TrackStock, item.StockCount);
    }

    public async Task<MenuItemDto?> UpdateItemAsync(int restaurantId, int itemId, UpdateMenuItemRequest request)
    {
        var item = await _db.MenuItems.FindAsync(itemId);
        if (item == null || item.RestaurantId != restaurantId)
            return null;

        if (request.Name != null) item.Name = request.Name;
        if (request.Description != null) item.Description = request.Description;
        if (request.Price.HasValue) item.Price = request.Price.Value;
        if (request.Allergens != null) item.Allergens = Infrastructure.JsonStringList.Serialize(request.Allergens);
        if (request.DietaryTags != null) item.DietaryTags = Infrastructure.JsonStringList.Serialize(request.DietaryTags);
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
        if (request.TrackStock.HasValue) item.TrackStock = request.TrackStock.Value;
        if (request.StockCount.HasValue) item.StockCount = request.StockCount.Value;

        await _db.SaveChangesAsync();
        _cache.Remove($"menu-restaurant-{restaurantId}");
        return new MenuItemDto(item.Id, item.CategoryId, item.Name, item.Description,
            item.Price,
            Infrastructure.JsonStringList.Parse(item.Allergens),
            Infrastructure.JsonStringList.Parse(item.DietaryTags),
            item.IsAvailable, item.ImageUrl, item.TrackStock, item.StockCount);
    }

    public async Task<object?> ToggleAvailabilityAsync(int restaurantId, int itemId)
    {
        var item = await _db.MenuItems.FindAsync(itemId);
        if (item == null || item.RestaurantId != restaurantId)
            return null;

        item.IsAvailable = !item.IsAvailable;
        await _db.SaveChangesAsync();
        _cache.Remove($"menu-restaurant-{restaurantId}");
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
        _cache.Remove($"menu-restaurant-{restaurantId}");
        return true;
    }

    public async Task<IEnumerable<MenuCategoryDto>> GetMenuAsync(int restaurantId)
    {
        // Cache key for menu data specific to restaurant
        string cacheKey = $"menu-restaurant-{restaurantId}";

        return await _cache.GetOrCreate(cacheKey, entry =>
        {
            // Set cache expiration to 30 minutes for menu data (changes less frequently)
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(30));

            return _db.MenuCategories
                .Include(c => c.Items)
                .Where(c => c.RestaurantId == restaurantId)
                .OrderBy(c => c.SortOrder)
                .Select(c => new MenuCategoryDto(
                    c.Id, c.Name, c.SortOrder,
                    c.Items.Where(i => i.IsAvailable)
                           .Select(i => new MenuItemDto(i.Id, i.CategoryId, i.Name, i.Description,
                               i.Price,
                               Infrastructure.JsonStringList.Parse(i.Allergens),
                               Infrastructure.JsonStringList.Parse(i.DietaryTags),
                               i.IsAvailable, i.ImageUrl, i.TrackStock, i.StockCount))
                           .ToList()))
                .ToListAsync();
        });
    }
}
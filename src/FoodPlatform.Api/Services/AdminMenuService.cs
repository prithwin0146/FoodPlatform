using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Admin-level menu operations — can manage any restaurant's menu.
/// (SRP: admin menu concerns separated from staff-scoped MenuService)
/// (DIP: controller depends on IAdminMenuService, not DbContext)
/// </summary>
public class AdminMenuService : IAdminMenuService
{
    private readonly FoodPlatformDbContext _db;

    public AdminMenuService(FoodPlatformDbContext db) => _db = db;

    public async Task<IEnumerable<MenuCategoryDto>> GetMenuAsync(int restaurantId)
    {
        var cats = await _db.MenuCategories
            .Include(c => c.Items)
            .Where(c => c.RestaurantId == restaurantId)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return cats.Select(c => new MenuCategoryDto(
            c.Id, c.Name, c.SortOrder,
            c.Items
             .Select(i => new MenuItemDto(i.Id, i.CategoryId, i.Name, i.Description,
                 i.Price,
                 Infrastructure.JsonStringList.Parse(i.Allergens),
                 Infrastructure.JsonStringList.Parse(i.DietaryTags),
                 i.IsAvailable, i.ImageUrl, i.TrackStock, i.StockCount))
             .ToList()));
    }

    public async Task<MenuCategoryDto> CreateCategoryAsync(AdminCreateCategoryRequest request)
    {
        var cat = new MenuCategory
        {
            RestaurantId = request.RestaurantId,
            Name = request.Name,
            SortOrder = request.SortOrder
        };
        _db.MenuCategories.Add(cat);
        await _db.SaveChangesAsync();
        return new MenuCategoryDto(cat.Id, cat.Name, cat.SortOrder, []);
    }

    public async Task<bool> DeleteCategoryAsync(int categoryId)
    {
        var cat = await _db.MenuCategories.FindAsync(categoryId);
        if (cat is null) return false;
        _db.MenuCategories.Remove(cat);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<MenuItemDto> CreateItemAsync(AdminCreateMenuItemRequest request)
    {
        var item = new MenuItem
        {
            RestaurantId = request.RestaurantId,
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
        return ToDto(item);
    }

    public async Task<MenuItemDto?> UpdateItemAsync(int itemId, AdminUpdateMenuItemRequest request)
    {
        var item = await _db.MenuItems.FindAsync(itemId);
        if (item is null) return null;

        if (request.Name != null)        item.Name = request.Name;
        if (request.Description != null) item.Description = request.Description;
        if (request.Price.HasValue)      item.Price = request.Price.Value;
        if (request.Allergens != null)   item.Allergens = Infrastructure.JsonStringList.Serialize(request.Allergens);
        if (request.DietaryTags != null) item.DietaryTags = Infrastructure.JsonStringList.Serialize(request.DietaryTags);
        if (request.CategoryId.HasValue) item.CategoryId = request.CategoryId.Value;
        if (request.ImageUrl != null)    item.ImageUrl = request.ImageUrl;
        if (request.IsAvailable.HasValue) item.IsAvailable = request.IsAvailable.Value;

        await _db.SaveChangesAsync();
        return ToDto(item);
    }

    public async Task<bool> DeleteItemAsync(int itemId)
    {
        var item = await _db.MenuItems.FindAsync(itemId);
        if (item is null) return false;
        _db.MenuItems.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }

    private static MenuItemDto ToDto(MenuItem i) =>
        new(i.Id, i.CategoryId, i.Name, i.Description,
            i.Price,
            Infrastructure.JsonStringList.Parse(i.Allergens),
            Infrastructure.JsonStringList.Parse(i.DietaryTags),
            i.IsAvailable, i.ImageUrl, i.TrackStock, i.StockCount);
}

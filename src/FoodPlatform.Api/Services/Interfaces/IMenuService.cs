using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Encapsulates menu management operations. (DIP: controllers depend on this, not DbContext)
/// </summary>
public interface IMenuService
{
    Task<MenuCategoryDto> CreateCategoryAsync(int restaurantId, CreateCategoryRequest request);
    /// <summary>Deletes a category and all its items if owned by the given restaurant.</summary>
    Task<bool> DeleteCategoryAsync(int restaurantId, int categoryId);
    Task<MenuItemDto?> CreateItemAsync(int restaurantId, CreateMenuItemRequest request);
    Task<MenuItemDto?> UpdateItemAsync(int restaurantId, int itemId, UpdateMenuItemRequest request);
    Task<object?> ToggleAvailabilityAsync(int restaurantId, int itemId);
    /// <summary>Soft-deletes an item (sets IsDeleted=true). Returns null if not found / wrong restaurant.</summary>
    Task<bool> DeleteItemAsync(int restaurantId, int itemId);
}

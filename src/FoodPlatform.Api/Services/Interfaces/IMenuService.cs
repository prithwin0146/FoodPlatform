using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Encapsulates menu management operations. (DIP: controllers depend on this, not DbContext)
/// </summary>
public interface IMenuService
{
    Task<MenuCategoryDto> CreateCategoryAsync(int restaurantId, CreateCategoryRequest request);
    Task<MenuItemDto?> CreateItemAsync(int restaurantId, CreateMenuItemRequest request);
    Task<MenuItemDto?> UpdateItemAsync(int restaurantId, int itemId, UpdateMenuItemRequest request);
    Task<object?> ToggleAvailabilityAsync(int restaurantId, int itemId);
}

using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Admin-only menu operations covering any restaurant.
/// (SRP: separated from IMenuService which is staff-scoped)
/// (ISP: focused interface; no order or restaurant-settings methods here)
/// </summary>
public interface IAdminMenuService
{
    Task<IEnumerable<MenuCategoryDto>> GetMenuAsync(int restaurantId);
    Task<MenuCategoryDto> CreateCategoryAsync(AdminCreateCategoryRequest request);
    Task<bool> DeleteCategoryAsync(int categoryId);

    Task<MenuItemDto> CreateItemAsync(AdminCreateMenuItemRequest request);
    Task<MenuItemDto?> UpdateItemAsync(int itemId, AdminUpdateMenuItemRequest request);
    Task<bool> DeleteItemAsync(int itemId);
}

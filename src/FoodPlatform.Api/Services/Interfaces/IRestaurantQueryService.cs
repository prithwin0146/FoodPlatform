using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Read-only restaurant queries for the public API. (SRP: query concern separated from admin mutations)
/// </summary>
public interface IRestaurantQueryService
{
    Task<IEnumerable<RestaurantDto>> ListActiveAsync(string? postcode = null);
    Task<RestaurantDetailDto?> GetDetailAsync(int id);
    Task<IEnumerable<RestaurantHoursDto>> GetHoursAsync(int id);
    Task<IEnumerable<MenuCategoryDto>> GetMenuAsync(int id);
}

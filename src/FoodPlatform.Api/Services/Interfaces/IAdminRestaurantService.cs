using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Admin-specific restaurant operations. (SRP: split from IAdminOrderService)
/// </summary>
public interface IAdminRestaurantService
{
    Task<IEnumerable<RestaurantDto>> GetAllAsync();
    Task<CreateRestaurantResponse> CreateAsync(CreateRestaurantRequest request);
    Task<RestaurantDto?> UpdateAsync(int id, UpdateRestaurantRequest request);
    Task<object?> ToggleActiveAsync(int id);
    /// <summary>Returns false if the restaurant was not found.</summary>
    Task<bool> DeleteAsync(int id);
}

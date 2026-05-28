using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Restaurant-level discount promotions management.
/// (ISP: restaurant staff manage their own promotions; admin manages via separate flow)
/// </summary>
public interface IRestaurantPromotionService
{
    /// <summary>Returns currently active promotions for a restaurant (used on the menu page).</summary>
    Task<IEnumerable<RestaurantPromotionDto>> GetActiveForRestaurantAsync(int restaurantId);

    /// <summary>Returns all promotions (active + inactive) for a restaurant — staff view.</summary>
    Task<IEnumerable<RestaurantPromotionDto>> GetAllForRestaurantAsync(int restaurantId);

    Task<RestaurantPromotionDto> CreateAsync(int restaurantId, CreateRestaurantPromotionRequest request);

    Task<RestaurantPromotionDto?> UpdateAsync(int id, int restaurantId, UpdateRestaurantPromotionRequest request);

    Task<bool> DeleteAsync(int id, int restaurantId);
}

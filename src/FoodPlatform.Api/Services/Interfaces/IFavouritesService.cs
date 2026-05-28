using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Customer favourites operations. (SRP: favouriting concern isolated from order + restaurant concerns)
/// (ISP: callers only depend on the three operations they need)
/// </summary>
public interface IFavouritesService
{
    /// <summary>Returns all restaurants the customer has saved.</summary>
    Task<IEnumerable<RestaurantDto>> GetFavouritesAsync(int userId);
    /// <summary>Saves a restaurant as a favourite. Returns false if already saved.</summary>
    Task<bool> AddFavouriteAsync(int userId, int restaurantId);
    /// <summary>Removes a restaurant from favourites. Returns false if it wasn't saved.</summary>
    Task<bool> RemoveFavouriteAsync(int userId, int restaurantId);
}

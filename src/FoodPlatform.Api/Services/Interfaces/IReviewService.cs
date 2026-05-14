using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Review operations. (SRP: review concern only, separate from order and restaurant concerns)
/// (ISP: callers that just need to submit reviews aren't forced to import restaurant query logic)
/// </summary>
public interface IReviewService
{
    /// <summary>Submit a review for a delivered order. Returns Fail if already reviewed or order not delivered.</summary>
    Task<ServiceResult<ReviewDto>> SubmitAsync(int orderId, int customerId, SubmitReviewRequest request);

    /// <summary>List all approved reviews for a restaurant, newest first.</summary>
    Task<IEnumerable<ReviewDto>> ListForRestaurantAsync(int restaurantId);

    /// <summary>Get the review the current customer left for a specific order, or null if none yet.</summary>
    Task<ReviewDto?> GetByOrderAsync(int orderId, int customerId);
}

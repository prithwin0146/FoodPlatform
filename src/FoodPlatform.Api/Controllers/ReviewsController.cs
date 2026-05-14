using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Review endpoints — customers submit, anyone can read.
/// (SRP: HTTP adapter only; delegates to IReviewService)
/// (DIP: depends on IReviewService abstraction)
/// </summary>
[Route("api")]
[ApiController]
public class ReviewsController : RestaurantScopedController
{
    private readonly IReviewService _reviews;

    public ReviewsController(IReviewService reviews) => _reviews = reviews;

    /// <summary>Submit a review for a delivered order.</summary>
    [HttpPost("orders/{orderId:int}/review")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Submit(int orderId, SubmitReviewRequest request)
    {
        var result = await _reviews.SubmitAsync(orderId, CurrentUserId, request);
        if (!result.IsSuccess)
            return result.Error switch
            {
                OrderServiceError.NotFound         => NotFound(new { error = result.ErrorMessage }),
                OrderServiceError.InvalidTransition => BadRequest(new { error = result.ErrorMessage }),
                _                                  => BadRequest(new { error = result.ErrorMessage })
            };
        return Ok(result.Value);
    }

    /// <summary>Get all reviews for a restaurant (public).</summary>
    [HttpGet("restaurants/{restaurantId:int}/reviews")]
    [AllowAnonymous]
    public async Task<IActionResult> ListForRestaurant(int restaurantId)
    {
        return Ok(await _reviews.ListForRestaurantAsync(restaurantId));
    }

    /// <summary>Get the customer's review for a specific order (if any).</summary>
    [HttpGet("orders/{orderId:int}/review")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetMyReview(int orderId)
    {
        var review = await _reviews.GetByOrderAsync(orderId, CurrentUserId);
        if (review is null) return NotFound();
        return Ok(review);
    }
}

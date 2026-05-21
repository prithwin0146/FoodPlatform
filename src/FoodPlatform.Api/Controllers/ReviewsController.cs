using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Review endpoints — customers submit, anyone can read.
/// (SRP: HTTP adapter only; delegates to IReviewService)
/// (DIP: depends on IReviewService and IUrlEncryptionService abstractions)
/// </summary>
[Route("api")]
[ApiController]
public class ReviewsController : RestaurantScopedController
{
    private readonly IReviewService _reviews;
    private readonly IUrlEncryptionService _urlEncryption;

    public ReviewsController(IReviewService reviews, IUrlEncryptionService urlEncryption)
    {
        _reviews = reviews;
        _urlEncryption = urlEncryption;
    }

    /// <summary>Submit a review for a delivered order.</summary>
    [HttpPost("orders/{hash}/review")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Submit(string hash, SubmitReviewRequest request)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return NotFound();
        var result = await _reviews.SubmitAsync(id.Value, CurrentUserId, request);
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
    [HttpGet("orders/{hash}/review")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetMyReview(string hash)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return NotFound();
        var review = await _reviews.GetByOrderAsync(id.Value, CurrentUserId);
        if (review is null) return NotFound();
        return Ok(review);
    }
}

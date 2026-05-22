using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Admin review moderation endpoints. (SRP: review moderation separated from public review submission)
/// (DIP: depends on IReviewService abstraction, not DbContext)
/// </summary>
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin")]
[ApiController]
public class AdminReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;

    public AdminReviewsController(IReviewService reviews) => _reviews = reviews;

    [HttpGet]
    public async Task<IActionResult> All([FromQuery] PaginationRequest pagination) =>
        Ok(await _reviews.ListAllAsync(pagination.Page, pagination.PageSize));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _reviews.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}

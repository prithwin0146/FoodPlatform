using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Staff-facing promotions management for their own restaurant.
/// (SRP: HTTP concerns only — business logic in IRestaurantPromotionService)
/// (DIP: depends on IRestaurantPromotionService, not DbContext)
/// </summary>
[Route("api/restaurant/promotions")]
[ApiController]
[Authorize(Roles = "Staff,Admin")]
public class RestaurantPromotionsController(IRestaurantPromotionService promotions) : RestaurantScopedController
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await promotions.GetAllForRestaurantAsync(CurrentRestaurantId));

    [HttpPost]
    public async Task<IActionResult> Create(CreateRestaurantPromotionRequest request)
    {
        var dto = await promotions.CreateAsync(CurrentRestaurantId, request);
        return CreatedAtAction(nameof(GetAll), dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateRestaurantPromotionRequest request)
    {
        var dto = await promotions.UpdateAsync(id, CurrentRestaurantId, request);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await promotions.DeleteAsync(id, CurrentRestaurantId);
        return deleted ? NoContent() : NotFound();
    }
}


using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Staff-facing auction management for their own restaurant.
/// (SRP: HTTP concerns only — business logic in IAuctionService)
/// (DIP: depends on IAuctionService, not DbContext)
/// </summary>
[Route("api/restaurant/auctions")]
[ApiController]
[Authorize(Roles = "Staff,Admin")]
public class RestaurantAuctionsController(IAuctionService auctions) : RestaurantScopedController
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await auctions.GetAllForRestaurantAsync(CurrentRestaurantId));

    [HttpGet("{id:int}/bids")]
    public async Task<IActionResult> GetBids(int id) =>
        Ok(await auctions.GetBidsAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create(CreateAuctionRequest request)
    {
        var dto = await auctions.CreateAsync(CurrentRestaurantId, request);
        return CreatedAtAction(nameof(GetAll), dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateAuctionRequest request)
    {
        var dto = await auctions.UpdateAsync(id, CurrentRestaurantId, request);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPut("{id:int}/camera")]
    public async Task<IActionResult> SetCamera(int id, SetAuctionCameraRequest request)
    {
        var dto = await auctions.SetCameraAsync(id, CurrentRestaurantId, request);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> Start(int id, StartAuctionRequest request)
    {
        var dto = await auctions.StartAsync(id, CurrentRestaurantId, request);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost("{id:int}/end")]
    public async Task<IActionResult> End(int id)
    {
        var dto = await auctions.EndAsync(id, CurrentRestaurantId);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await auctions.DeleteAsync(id, CurrentRestaurantId);
        return deleted ? NoContent() : NotFound();
    }
}

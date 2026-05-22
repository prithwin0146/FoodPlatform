using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Admin restaurant operations. (SRP: split from AdminOrdersController)
/// (DIP: depends on IAdminRestaurantService and IUrlEncryptionService interfaces)
/// </summary>
[Route("api/admin/restaurants")]
[Authorize(Roles = "Admin")]
[ApiController]
public class AdminRestaurantsController : ControllerBase
{
    private readonly IAdminRestaurantService _restaurants;
    private readonly IUrlEncryptionService _urlEncryption;

    public AdminRestaurantsController(IAdminRestaurantService restaurants, IUrlEncryptionService urlEncryption)
    {
        _restaurants = restaurants;
        _urlEncryption = urlEncryption;
    }

    [HttpGet]
    public async Task<IActionResult> AllRestaurants()
    {
        var list = await _restaurants.GetAllAsync();
        return Ok(list.Select(r => r with { HashId = _urlEncryption.Encrypt(r.Id) }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateRestaurantRequest request)
    {
        var result = await _restaurants.CreateAsync(request);
        return Ok(result with { HashId = _urlEncryption.Encrypt(result.Id) });
    }

    [HttpPatch("{hash}")]
    public async Task<IActionResult> Update(string hash, UpdateRestaurantRequest request)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return BadRequest("Invalid restaurant identifier.");
        var result = await _restaurants.UpdateAsync(id.Value, request);
        return result is null ? NotFound() : Ok(result with { HashId = hash });
    }

    [HttpPatch("{hash}/activate")]
    public async Task<IActionResult> ToggleActive(string hash)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return BadRequest("Invalid restaurant identifier.");
        var result = await _restaurants.ToggleActiveAsync(id.Value);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{hash}")]
    public async Task<IActionResult> Delete(string hash)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return BadRequest("Invalid restaurant identifier.");
        var deleted = await _restaurants.DeleteAsync(id.Value);
        return deleted ? NoContent() : NotFound();
    }
}

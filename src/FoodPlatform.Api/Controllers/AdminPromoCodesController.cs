using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Admin CRUD for platform-wide promo codes.
/// (SRP: HTTP mapping only — business logic in IPromoCodeService)
/// </summary>
[Route("api/admin/promo-codes")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminPromoCodesController(IPromoCodeService promos) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await promos.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var dto = await promos.GetByIdAsync(id);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePromoCodeRequest request)
    {
        var dto = await promos.CreateAsync(request);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdatePromoCodeRequest request)
    {
        var dto = await promos.UpdateAsync(id, request);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await promos.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}

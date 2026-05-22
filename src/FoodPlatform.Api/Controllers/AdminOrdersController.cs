using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Admin order operations. (SRP: split from AdminRestaurantsController)
/// (DIP: depends on IAdminOrderService interface, not DbContext)
/// </summary>
[Route("api/admin/orders")]
[Authorize(Roles = "Admin")]
[ApiController]
public class AdminOrdersController : ControllerBase
{
    private readonly IAdminOrderService _orders;
    private readonly IUrlEncryptionService _urlEncryption;

    public AdminOrdersController(IAdminOrderService orders, IUrlEncryptionService urlEncryption)
    {
        _orders = orders;
        _urlEncryption = urlEncryption;
    }

    [HttpGet]
    public async Task<IActionResult> AllOrders(
        [FromQuery] PaginationRequest pagination,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var paged = await _orders.GetAllAsync(pagination.Page, pagination.PageSize, status, search);
        var enriched = paged with
        {
            Items = paged.Items.Select(o => o with { HashId = _urlEncryption.Encrypt(o.Id) }).ToList()
        };
        return Ok(enriched);
    }

    [HttpGet("disputed")]
    public async Task<IActionResult> DisputedOrders()
    {
        var orders = await _orders.GetDisputedAsync();
        return Ok(orders.Select(o => o with { HashId = _urlEncryption.Encrypt(o.Id) }));
    }

    [HttpPost("{hash}/refund")]
    public async Task<IActionResult> Refund(string hash)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return NotFound();
        var result = await _orders.RefundAsync(id.Value);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("{hash}/resolve")]
    public async Task<IActionResult> Resolve(string hash)
    {
        var id = _urlEncryption.Decrypt(hash);
        if (id is null) return NotFound();
        var result = await _orders.ResolveAsync(id.Value);
        return result is null ? NotFound() : Ok(result);
    }
}

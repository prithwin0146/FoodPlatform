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
    private readonly IHashIdService _hashIds;

    public AdminOrdersController(IAdminOrderService orders, IHashIdService hashIds)
    {
        _orders = orders;
        _hashIds = hashIds;
    }

    [HttpGet]
    public async Task<IActionResult> AllOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var paged = await _orders.GetAllAsync(page, pageSize);
        var enriched = paged with
        {
            Items = paged.Items.Select(o => o with { HashId = _hashIds.Encode(o.Id) }).ToList()
        };
        return Ok(enriched);
    }

    [HttpGet("disputed")]
    public async Task<IActionResult> DisputedOrders()
    {
        var orders = await _orders.GetDisputedAsync();
        return Ok(orders.Select(o => o with { HashId = _hashIds.Encode(o.Id) }));
    }

    [HttpPost("{hash}/refund")]
    public async Task<IActionResult> Refund(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _orders.RefundAsync(id.Value);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("{hash}/resolve")]
    public async Task<IActionResult> Resolve(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _orders.ResolveAsync(id.Value);
        return result is null ? NotFound() : Ok(result);
    }
}

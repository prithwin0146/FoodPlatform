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

    public AdminOrdersController(IAdminOrderService orders) => _orders = orders;

    [HttpGet]
    public async Task<IActionResult> AllOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50) =>
        Ok(await _orders.GetAllAsync(page, pageSize));

    [HttpGet("disputed")]
    public async Task<IActionResult> DisputedOrders() =>
        Ok(await _orders.GetDisputedAsync());

    [HttpPost("{id:int}/refund")]
    public async Task<IActionResult> Refund(int id)
    {
        var result = await _orders.RefundAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("{id:int}/resolve")]
    public async Task<IActionResult> Resolve(int id)
    {
        var result = await _orders.ResolveAsync(id);
        return result is null ? NotFound() : Ok(result);
    }
}

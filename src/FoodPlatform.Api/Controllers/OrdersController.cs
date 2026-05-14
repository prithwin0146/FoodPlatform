using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Thin HTTP adapter for order operations.
/// (DIP: depends on IOrderService, not DbContext)
/// (SRP: all business logic — postcode validation, hours checking, state machine — lives in OrderService)
/// </summary>
[Route("api/orders")]
[Authorize]
public class OrdersController : RestaurantScopedController
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> PlaceOrder(PlaceOrderRequest request)
    {
        var result = await _orders.PlaceOrderAsync(request, CurrentUserId);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.ErrorMessage });
        return Ok(result.Value);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var order = await _orders.GetAsync(id);
        if (order == null) return NotFound();

        // Access control: customer sees own orders, staff sees their restaurant's
        if (User.IsInRole("Customer") && order.UserId != CurrentUserId)
            return Unauthorized();
        if (User.IsInRole("Staff") && order.RestaurantId != CurrentRestaurantId)
            return Unauthorized();

        return Ok(order);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> ListMyOrders()
    {
        return Ok(await _orders.ListForUserAsync(CurrentUserId));
    }

    [HttpGet]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> List([FromQuery] string? status)
    {
        int? restaurantId = IsAdmin ? null : CurrentRestaurantId;
        return Ok(await _orders.ListAsync(restaurantId, status));
    }

    [HttpPatch("{id:int}/accept")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Accept(int id, AcceptOrderRequest request)
    {
        var result = await _orders.AcceptAsync(id, CurrentRestaurantId, request);
        return ToActionResult(result);
    }

    [HttpPatch("{id:int}/reject")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Reject(int id, RejectOrderRequest request)
    {
        var result = await _orders.RejectAsync(id, CurrentRestaurantId, request);
        return ToActionResult(result);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateStatusRequest request)
    {
        var result = await _orders.UpdateStatusAsync(id, CurrentRestaurantId, request);
        return ToActionResult(result);
    }

    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await _orders.CancelAsync(id, CurrentUserId);
        return ToActionResult(result);
    }

    [HttpPost("{id:int}/dispute")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Dispute(int id, DisputeRequest request)
    {
        var result = await _orders.DisputeAsync(id, CurrentUserId, request);
        return ToActionResult(result);
    }

    /// <summary>Re-place a previous order with the same items + delivery address.</summary>
    [HttpPost("{id:int}/reorder")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Reorder(int id, [FromBody] ReorderRequest request)
    {
        var result = await _orders.ReorderAsync(id, CurrentUserId, request.IdempotencyKey);
        if (!result.IsSuccess)
            return result.Error switch
            {
                OrderServiceError.NotFound => NotFound(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage })
            };
        return Ok(result.Value);
    }

    private IActionResult ToActionResult(ServiceResult<object> result)
    {
        if (result.IsSuccess) return Ok(result.Value);
        return result.Error switch
        {
            OrderServiceError.NotFound      => NotFound(new { error = result.ErrorMessage }),
            OrderServiceError.Unauthorized  => Unauthorized(new { error = result.ErrorMessage }),
            _                               => BadRequest(new { error = result.ErrorMessage })
        };
    }
}

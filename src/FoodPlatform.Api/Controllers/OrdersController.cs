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
    private readonly IAngelcamService _angelcam;
    private readonly IHashIdService _hashIds;

    public OrdersController(IOrderService orders, IAngelcamService angelcam, IHashIdService hashIds)
    {
        _orders = orders;
        _angelcam = angelcam;
        _hashIds = hashIds;
    }

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> PlaceOrder(PlaceOrderRequest request)
    {
        var result = await _orders.PlaceOrderAsync(request, CurrentUserId);
        if (!result.IsSuccess)
            return BadRequest(new { error = result.ErrorMessage });
        var order = result.Value!;
        return Ok(order with { HashId = _hashIds.Encode(order.Id) });
    }

    [HttpGet("{hash}")]
    public async Task<IActionResult> Get(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var order = await _orders.GetAsync(id.Value);
        if (order == null) return NotFound();

        // Access control: customer sees own orders, staff sees their restaurant's
        if (User.IsInRole("Customer") && order.UserId != CurrentUserId)
            return Unauthorized();
        if (User.IsInRole("Staff") && order.RestaurantId != CurrentRestaurantId)
            return Unauthorized();

        return Ok(order with { HashId = hash });
    }

    [HttpGet("my")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> ListMyOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var paged = await _orders.ListForUserPagedAsync(CurrentUserId, page, pageSize);
        var enriched = paged with
        {
            Items = paged.Items.Select(o => o with { HashId = _hashIds.Encode(o.Id) }).ToList()
        };
        return Ok(enriched);
    }

    [HttpGet]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> List([FromQuery] string? status)
    {
        int? restaurantId = IsAdmin ? null : CurrentRestaurantId;
        var orders = await _orders.ListAsync(restaurantId, status);
        return Ok(orders.Select(o => o with { HashId = _hashIds.Encode(o.Id) }));
    }

    [HttpPatch("{hash}/accept")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Accept(string hash, AcceptOrderRequest request)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _orders.AcceptAsync(id.Value, CurrentRestaurantId, request);
        return ToActionResult(result);
    }

    [HttpPatch("{hash}/reject")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Reject(string hash, RejectOrderRequest request)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _orders.RejectAsync(id.Value, CurrentRestaurantId, request);
        return ToActionResult(result);
    }

    [HttpPatch("{hash}/status")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> UpdateStatus(string hash, UpdateStatusRequest request)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _orders.UpdateStatusAsync(id.Value, CurrentRestaurantId, request);
        return ToActionResult(result);
    }

    [HttpPost("{hash}/cancel")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Cancel(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _orders.CancelAsync(id.Value, CurrentUserId);
        return ToActionResult(result);
    }

    [HttpPost("{hash}/dispute")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Dispute(string hash, DisputeRequest request)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _orders.DisputeAsync(id.Value, CurrentUserId, request);
        return ToActionResult(result);
    }

    /// <summary>Re-place a previous order with the same items + delivery address.</summary>
    [HttpPost("{hash}/reorder")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Reorder(string hash, [FromBody] ReorderRequest request)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var result = await _orders.ReorderAsync(id.Value, CurrentUserId, request.IdempotencyKey);
        if (!result.IsSuccess)
            return result.Error switch
            {
                OrderServiceError.NotFound => NotFound(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage })
            };
        var reorder = result.Value!;
        return Ok(reorder with { HashId = _hashIds.Encode(reorder.Id) });
    }

    /// <summary>
    /// Returns a fresh, time-limited Angelcam HLS URL for the order's restaurant camera.
    /// (SRP: Angelcam HTTP call is delegated to IAngelcamService)
    /// </summary>
    [HttpGet("{hash}/live-stream-url")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetLiveStreamUrl(string hash)
    {
        var id = _hashIds.Decode(hash);
        if (id is null) return NotFound();
        var order = await _orders.GetAsync(id.Value);
        if (order == null || order.UserId != CurrentUserId)
            return NotFound(new { error = "Order not found" });
        if (string.IsNullOrEmpty(order.LiveStreamPlaybackId))
            return NotFound(new { error = "No camera configured for this restaurant" });

        var hlsUrl = await _angelcam.GetHlsUrlAsync(order.LiveStreamPlaybackId);
        if (hlsUrl == null)
            return NotFound(new { error = "Stream is currently unavailable" });

        return Ok(new { hlsUrl });
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

using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Controllers;

[Route("api/admin")]
[Authorize(Roles = "Admin")]
[ApiController]
public class AdminController : ControllerBase
{
    private readonly FoodPlatformDbContext _db;
    public AdminController(FoodPlatformDbContext db) => _db = db;

    [HttpGet("orders")]
    public async Task<IActionResult> AllOrders()
    {
        var orders = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return Ok(orders.Select(o => new OrderDto(
            o.Id, o.RestaurantId, o.UserId, o.Status,
            o.RejectionReason, o.DisputeStatus, o.DisputeNotes,
            o.TotalAmount, o.DeliveryPostcode, o.EstimatedDeliveryTime,
            o.CancellableUntil, o.CreatedAt,
            o.Items.Select(i => new OrderItemDto(i.Id, i.MenuItemId,
                i.MenuItem?.Name ?? "", i.Quantity, i.UnitPrice)).ToList())));
    }

    [HttpGet("orders/disputed")]
    public async Task<IActionResult> DisputedOrders()
    {
        var orders = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Where(o => o.DisputeStatus == "Open")
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        return Ok(orders.Select(o => new OrderDto(
            o.Id, o.RestaurantId, o.UserId, o.Status,
            o.RejectionReason, o.DisputeStatus, o.DisputeNotes,
            o.TotalAmount, o.DeliveryPostcode, o.EstimatedDeliveryTime,
            o.CancellableUntil, o.CreatedAt,
            o.Items.Select(i => new OrderItemDto(i.Id, i.MenuItemId,
                i.MenuItem?.Name ?? "", i.Quantity, i.UnitPrice)).ToList())));
    }

    [HttpPost("orders/{id:int}/refund")]
    public async Task<IActionResult> Refund(int id)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order == null) return NotFound();

        // TODO: Issue actual Stripe refund via PaymentIntentId
        order.Status = "Cancelled";
        order.DisputeStatus = "Resolved";
        await _db.SaveChangesAsync();
        return Ok(new { order.Id, order.Status, order.DisputeStatus });
    }

    [HttpGet("restaurants")]
    public async Task<IActionResult> AllRestaurants()
    {
        var restaurants = await _db.Restaurants
            .Select(r => new RestaurantDto(r.Id, r.Name, r.Address, r.BasePostcode,
                r.DeliveryRadiusMiles, r.HygieneRating, r.IsActive))
            .ToListAsync();
        return Ok(restaurants);
    }

    [HttpPost("restaurants")]
    public async Task<IActionResult> Create(CreateRestaurantRequest request)
    {
        var restaurant = new Restaurant
        {
            Name = request.Name,
            Address = request.Address,
            BasePostcode = request.BasePostcode,
            DeliveryRadiusMiles = request.DeliveryRadiusMiles,
            HygieneRating = request.HygieneRating
        };
        _db.Restaurants.Add(restaurant);
        await _db.SaveChangesAsync();
        return Ok(new RestaurantDto(restaurant.Id, restaurant.Name, restaurant.Address,
            restaurant.BasePostcode, restaurant.DeliveryRadiusMiles, restaurant.HygieneRating, restaurant.IsActive));
    }

    [HttpPatch("restaurants/{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateRestaurantRequest request)
    {
        var restaurant = await _db.Restaurants.FindAsync(id);
        if (restaurant == null) return NotFound();

        if (request.Name != null) restaurant.Name = request.Name;
        if (request.Address != null) restaurant.Address = request.Address;
        if (request.BasePostcode != null) restaurant.BasePostcode = request.BasePostcode;
        if (request.DeliveryRadiusMiles.HasValue) restaurant.DeliveryRadiusMiles = request.DeliveryRadiusMiles.Value;
        if (request.HygieneRating.HasValue) restaurant.HygieneRating = request.HygieneRating.Value;

        await _db.SaveChangesAsync();
        return Ok(new RestaurantDto(restaurant.Id, restaurant.Name, restaurant.Address,
            restaurant.BasePostcode, restaurant.DeliveryRadiusMiles, restaurant.HygieneRating, restaurant.IsActive));
    }

    [HttpPatch("restaurants/{id:int}/activate")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var restaurant = await _db.Restaurants.FindAsync(id);
        if (restaurant == null) return NotFound();

        restaurant.IsActive = !restaurant.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { restaurant.Id, restaurant.IsActive });
    }
}

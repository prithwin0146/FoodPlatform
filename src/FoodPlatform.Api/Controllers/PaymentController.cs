using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Exposes a single endpoint to create a Stripe PaymentIntent before an order is placed.
/// Amount is always computed server-side from live menu prices to prevent tampering.
/// (SRP: payment intent creation is isolated from the order flow)
/// (DIP: depends on IStripeService abstraction)
/// </summary>
[Route("api/payment-intent")]
[Authorize(Roles = "Customer")]
[ApiController]
public class PaymentController : ControllerBase
{
    private readonly FoodPlatformDbContext _db;
    private readonly IStripeService _stripe;

    public PaymentController(FoodPlatformDbContext db, IStripeService stripe)
    {
        _db = db;
        _stripe = stripe;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePaymentIntentRequest request)
    {
        // Validate restaurant is active
        var restaurant = await _db.Restaurants
            .FirstOrDefaultAsync(r => r.Id == request.RestaurantId && r.IsActive);

        if (restaurant == null)
            return BadRequest(new { error = "Restaurant not found or inactive" });

        // Compute total server-side to prevent client-side price tampering
        var menuItemIds = request.Items.Select(i => i.MenuItemId).ToList();
        var menuItems = await _db.MenuItems
            .Where(m => menuItemIds.Contains(m.Id)
                     && m.RestaurantId == request.RestaurantId
                     && m.IsAvailable)
            .ToDictionaryAsync(m => m.Id);

        if (menuItems.Count != menuItemIds.Distinct().Count())
            return BadRequest(new { error = "One or more items are unavailable" });

        decimal total = request.Items
            .Sum(i => menuItems[i.MenuItemId].Price * i.Quantity);

        // Create the Stripe PaymentIntent — idempotent using the client-supplied key
        var (clientSecret, paymentIntentId) =
            await _stripe.CreatePaymentIntentAsync(total, request.IdempotencyKey);

        return Ok(new CreatePaymentIntentResponse(clientSecret, paymentIntentId, total));
    }
}

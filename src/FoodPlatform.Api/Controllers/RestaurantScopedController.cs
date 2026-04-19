using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

[ApiController]
public abstract class RestaurantScopedController : ControllerBase
{
    protected int CurrentRestaurantId =>
        int.Parse(User.FindFirstValue("restaurantId") ?? "0");

    protected int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    protected bool IsAdmin =>
        User.IsInRole("Admin");
}

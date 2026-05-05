using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

[ApiController]
public abstract class RestaurantScopedController : ControllerBase
{
    /// <summary>
    /// The restaurant this staff member is scoped to.
    /// Throws if the JWT is missing the restaurantId claim — indicates a token generation bug.
    /// </summary>
    protected int CurrentRestaurantId =>
        int.TryParse(User.FindFirstValue("restaurantId"), out var rid) && rid > 0
            ? rid
            : throw new InvalidOperationException(
                "JWT is missing a valid restaurantId claim. Token generation may be misconfigured.");

    /// <summary>
    /// The authenticated user's ID.
    /// Throws if the nameidentifier claim is absent — should never happen on a valid JWT.
    /// </summary>
    protected int CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) && uid > 0
            ? uid
            : throw new InvalidOperationException(
                "JWT is missing a valid nameidentifier claim.");

    protected bool IsAdmin =>
        User.IsInRole("Admin");
}

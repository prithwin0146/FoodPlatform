using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

/// <summary>
/// Admin user management endpoints.
/// (SRP: user queries only — auth lives in AuthController)
/// (DIP: depends on IAdminUserService, not DbContext)
/// </summary>
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
[ApiController]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _users;

    public AdminUsersController(IAdminUserService users) => _users = users;

    [HttpGet]
    public async Task<IActionResult> AllUsers([FromQuery] PaginationRequest pagination) =>
        Ok(await _users.GetAllAsync(pagination.Page, pagination.PageSize));

    /// <summary>Changes a user's role and optional restaurant assignment.</summary>
    [HttpPatch("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest request)
    {
        var callerUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var result = await _users.UpdateUserAsync(id, request, callerUserId);
        if (result is null)
        {
            // null can mean NotFound OR a lockout-protection violation — return 400 with a hint
            return BadRequest(new { error = "Update rejected. Possible reasons: user not found, self-demotion, last-admin demotion, or invalid RestaurantId." });
        }
        return Ok(result);
    }
}

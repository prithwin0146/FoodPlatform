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
    public async Task<IActionResult> AllUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50) =>
        Ok(await _users.GetAllAsync(page, pageSize));
}

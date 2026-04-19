using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoodPlatform.Api.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _auth.LoginAsync(request);
        if (result == null) return Unauthorized(new { error = "Invalid email or password" });
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await _auth.RegisterAsync(request);
        if (result == null) return Conflict(new { error = "Email already registered" });
        return Ok(result);
    }
}

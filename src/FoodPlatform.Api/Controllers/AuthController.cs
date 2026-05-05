using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FoodPlatform.Api.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    // DIP: depends on IAuthService abstraction, not the concrete AuthService
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _auth.LoginAsync(request);
        if (result == null) return Unauthorized(new { error = "Invalid email or password. Make sure your email is verified." });
        return Ok(result);
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var (result, error) = await _auth.RegisterAsync(request);
        if (result == null) return Conflict(new { error });
        return Ok(result);
    }

    [HttpPost("verify-otp")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> VerifyOtp(VerifyOtpRequest request)
    {
        var (result, error) = await _auth.VerifyOtpAsync(request);
        if (result == null) return BadRequest(new { error });
        return Ok(result);
    }

    [HttpPost("resend-otp")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResendOtp(ResendOtpRequest request)
    {
        var (success, error) = await _auth.ResendOtpAsync(request);
        if (!success) return BadRequest(new { error });
        return Ok(new { message = "A new verification code has been sent." });
    }
}

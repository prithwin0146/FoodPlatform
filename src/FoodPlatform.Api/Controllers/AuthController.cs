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
        // Anti-enumeration: AuthService never returns an error here — always 200 + generic ack.
        var (result, _) = await _auth.RegisterAsync(request);
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
        // Anti-enumeration: response is identical whether the account exists, is verified,
        // or is still inside the cooldown window.
        await _auth.ResendOtpAsync(request);
        return Ok(new { message = "If that account exists and is unverified, a new code has been sent." });
    }
}

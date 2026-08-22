using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
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
        return result.Outcome switch
        {
            LoginOutcome.Success           => Ok(result.Token),
            LoginOutcome.EmailNotVerified  => Unauthorized(new { error = "Please verify your email before signing in.", code = "EMAIL_NOT_VERIFIED" }),
            _                              => Unauthorized(new { error = "Invalid email or password." })
        };
    }

    [HttpPost("oauth/google")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> LoginWithGoogle([FromBody] OAuthLoginRequest request)
    {
        var result = await _auth.LoginWithOAuthAsync(request);
        return result.Outcome == LoginOutcome.Success 
            ? Ok(result.Token) 
            : Unauthorized(new { error = "Invalid Google login." });
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

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        await _auth.ForgotPasswordAsync(request);
        // Anti-enumeration: always return the same message.
        return Ok(new { message = "If an account with that email exists, a 6-digit reset code has been sent." });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var (success, error) = await _auth.ResetPasswordAsync(request);
        if (!success) return BadRequest(new { error });
        return Ok(new { message = "Password updated. You can now sign in with your new password." });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirst("sub") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized();

        var (success, error) = await _auth.ChangePasswordAsync(userId, request);
        if (!success) return BadRequest(new { error });
        return Ok(new { message = "Password changed successfully." });
    }
}

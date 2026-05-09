using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: auth DTOs isolated from menu, order and restaurant DTOs)
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RegisterRequest(
    [Required, MinLength(2), MaxLength(50)] string Username,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);

public record AuthResponse(string Token, string Role, string Username, int UserId, int? RestaurantId);

/// <summary>Returned by POST /register — no token yet, user must verify email first.</summary>
public record RegisterResponse(string Email, string Message);

public record VerifyOtpRequest(
    [Required, EmailAddress] string Email,
    [Required, StringLength(6, MinimumLength = 6)] string Otp);

public record ResendOtpRequest(
    [Required, EmailAddress] string Email);

public record ForgotPasswordRequest(
    [Required, EmailAddress] string Email);

public record ResetPasswordRequest(
    [Required, EmailAddress] string Email,
    [Required, StringLength(6, MinimumLength = 6)] string Otp,
    [Required, MinLength(8)] string NewPassword);

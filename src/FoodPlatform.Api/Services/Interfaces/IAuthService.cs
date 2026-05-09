using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Handles user authentication and registration. (SRP: auth logic only, no JWT or hashing details)
/// </summary>
public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<(RegisterResponse? Response, string? Error)> RegisterAsync(RegisterRequest request);
    Task<(AuthResponse? Response, string? Error)> VerifyOtpAsync(VerifyOtpRequest request);
    Task<(bool Success, string? Error)> ResendOtpAsync(ResendOtpRequest request);
    Task<(bool Success, string? Error)> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<(bool Success, string? Error)> ResetPasswordAsync(ResetPasswordRequest request);
}

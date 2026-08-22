using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Discriminated union for login outcomes. Allows the controller to return
/// different HTTP responses without leaking internal auth logic. (SRP / ISP)
/// </summary>
public enum LoginOutcome { Success, InvalidCredentials, EmailNotVerified }
public record LoginResult(LoginOutcome Outcome, AuthResponse? Token = null, string? ErrorMessage = null);

/// <summary>
/// Handles user authentication and registration. (SRP: auth logic only, no JWT or hashing details)
/// </summary>
public interface IAuthService
{
    Task<LoginResult> LoginAsync(LoginRequest request);
    Task<LoginResult> LoginWithOAuthAsync(OAuthLoginRequest request);
    Task<(RegisterResponse? Response, string? Error)> RegisterAsync(RegisterRequest request);
    Task<(AuthResponse? Response, string? Error)> VerifyOtpAsync(VerifyOtpRequest request);
    Task<(bool Success, string? Error)> ResendOtpAsync(ResendOtpRequest request);
    Task<(bool Success, string? Error)> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<(bool Success, string? Error)> ResetPasswordAsync(ResetPasswordRequest request);
    Task<(bool Success, string? Error)> ChangePasswordAsync(int userId, ChangePasswordRequest request);
}

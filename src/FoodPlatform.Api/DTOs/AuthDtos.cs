using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: auth DTOs isolated from menu, order and restaurant DTOs)
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RegisterRequest(
    [Required, MinLength(2), MaxLength(50)] string Username,
    [Required, EmailAddress] string Email,
    /// <summary>Min 8 chars with at least one uppercase letter, one digit, and one special character.</summary>
    [Required, MinLength(8), MaxLength(128),
     RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$",
         ErrorMessage = "Password must be at least 8 characters and contain at least one uppercase letter, one number, and one special character.")]
    string Password);

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
    [Required, MinLength(8), MaxLength(128),
     RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$",
         ErrorMessage = "Password must be at least 8 characters and contain at least one uppercase letter, one number, and one special character.")]
    string NewPassword);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8), MaxLength(128),
     RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$",
         ErrorMessage = "Password must be at least 8 characters and contain at least one uppercase letter, one number, and one special character.")]
    string NewPassword);

/// <summary>Admin-facing view of a registered user. (SRP: separate from AuthResponse which is customer-facing)</summary>
public record UserDto(
    int Id,
    string Username,
    string Email,
    string Role,
    bool IsEmailVerified,
    int? RestaurantId,
    DateTime CreatedAt);

/// <summary>Admin payload to update a user's role and restaurant assignment.</summary>
public record UpdateUserRequest(
    [Required] string Role,
    int? RestaurantId);

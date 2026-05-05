using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Handles authentication, registration and OTP email verification.
/// (SRP: delegates JWT to IJwtTokenService, hashing to IPasswordHasher, email to IEmailService)
/// (DIP: depends on abstractions only)
/// </summary>
public class AuthService : IAuthService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IPasswordHasher _hasher;
    private readonly IEmailService _email;

    public AuthService(FoodPlatformDbContext db, IJwtTokenService jwt,
        IPasswordHasher hasher, IEmailService email)
    {
        _db = db;
        _jwt = jwt;
        _hasher = hasher;
        _email = email;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !_hasher.Verify(request.Password, user.PasswordHash))
            return null;
        if (!user.IsEmailVerified)
            return null; // treat unverified as bad credentials

        return new AuthResponse(_jwt.GenerateToken(user), user.Role, user.Username, user.Id, user.RestaurantId);
    }

    public async Task<(RegisterResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return (null, "Email already registered");
        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            return (null, "Username already taken");

        var otp = GenerateOtp();
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _hasher.Hash(request.Password),
            Role = "Customer",
            IsEmailVerified = false,
            OtpCode = otp,
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(10)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _ = _email.SendOtpAsync(user.Email, user.Username, otp);

        return (new RegisterResponse(user.Email, "Check your inbox for a 6-digit verification code."), null);
    }

    public async Task<(AuthResponse? Response, string? Error)> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return (null, "Account not found");
        if (user.IsEmailVerified)
            return (null, "Email already verified — please log in");
        if (user.OtpCode == null || user.OtpExpiresAt == null)
            return (null, "No verification code on record — request a new one");
        if (DateTime.UtcNow > user.OtpExpiresAt)
            return (null, "Verification code has expired — request a new one");
        if (user.OtpCode != request.Otp)
            return (null, "Incorrect verification code");

        user.IsEmailVerified = true;
        user.OtpCode = null;
        user.OtpExpiresAt = null;
        await _db.SaveChangesAsync();

        return (new AuthResponse(_jwt.GenerateToken(user), user.Role, user.Username, user.Id, user.RestaurantId), null);
    }

    public async Task<(bool Success, string? Error)> ResendOtpAsync(ResendOtpRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) return (false, "Account not found");
        if (user.IsEmailVerified) return (false, "Email already verified");

        // Rate-limit resend: block if a non-expired code exists and was sent < 1 min ago
        if (user.OtpExpiresAt.HasValue && DateTime.UtcNow < user.OtpExpiresAt.Value.AddMinutes(-9))
            return (false, "Please wait before requesting another code");

        var otp = GenerateOtp();
        user.OtpCode = otp;
        user.OtpExpiresAt = DateTime.UtcNow.AddMinutes(10);
        await _db.SaveChangesAsync();

        _ = _email.SendOtpAsync(user.Email, user.Username, otp);
        return (true, null);
    }

    // ── private ──────────────────────────────────────────────────────────────

    private static string GenerateOtp() =>
        Random.Shared.Next(100_000, 999_999).ToString();
}


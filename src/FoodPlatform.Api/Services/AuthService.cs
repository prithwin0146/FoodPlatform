using System.Security.Cryptography;
using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Handles authentication, registration and OTP email verification.
/// (SRP: delegates JWT to IJwtTokenService, hashing to IPasswordHasher, email to IEmailService)
/// (DIP: depends on abstractions only — IBackgroundJobClient replaces static BackgroundJob)
/// </summary>
public class AuthService : IAuthService
{
    /// <summary>Minimum gap between successive OTP dispatches for the same account.</summary>
    private static readonly TimeSpan OtpResendCooldown = TimeSpan.FromSeconds(60);

    /// <summary>Lifetime of an OTP after dispatch.</summary>
    private static readonly TimeSpan OtpLifetime = TimeSpan.FromMinutes(10);

    /// <summary>Generic message returned by both register and resend so attackers cannot enumerate accounts.</summary>
    private const string GenericRegisterAck =
        "If that email address is available, a 6-digit verification code has been sent. Check your inbox.";

    private readonly FoodPlatformDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IPasswordHasher _hasher;
    private readonly IBackgroundJobClient _jobs;
    private readonly IOAuthVerificationService _oauth;

    public AuthService(FoodPlatformDbContext db, IJwtTokenService jwt,
        IPasswordHasher hasher, IBackgroundJobClient jobs, IOAuthVerificationService oauth)
    {
        _db = db;
        _jwt = jwt;
        _hasher = hasher;
        _jobs = jobs;
        _oauth = oauth;
    }

    public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email || u.Username == request.Email);
        if (user == null || (user.AuthProvider != "Local" && !string.IsNullOrEmpty(user.AuthProvider)) || !_hasher.Verify(request.Password, user.PasswordHash))
            return new LoginResult(LoginOutcome.InvalidCredentials);
        if (!user.IsEmailVerified)
            return new LoginResult(LoginOutcome.EmailNotVerified);

        var token = _jwt.GenerateToken(user);
        return new LoginResult(LoginOutcome.Success,
            new AuthResponse(token, user.Role, user.Username, user.Id, user.RestaurantId));
    }

    public async Task<LoginResult> LoginWithOAuthAsync(OAuthLoginRequest request)
    {
        OAuthVerificationResult verification;
        if (request.Provider == "Google")
            verification = await _oauth.VerifyGoogleTokenAsync(request.IdToken);
        else if (request.Provider == "Apple")
            verification = await _oauth.VerifyAppleTokenAsync(request.IdToken);
        else
            return new LoginResult(LoginOutcome.InvalidCredentials, ErrorMessage: "Unsupported OAuth provider.");

        if (!verification.IsSuccessful)
            return new LoginResult(LoginOutcome.InvalidCredentials, ErrorMessage: verification.ErrorMessage);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == verification.Email);
        if (user == null)
        {
            // Auto-register OAuth user
            user = new User
            {
                Email = verification.Email,
                Username = verification.Name,
                AuthProvider = request.Provider,
                ProviderId = verification.ProviderId,
                IsEmailVerified = true, // OAuth emails are pre-verified by the provider
                Role = "Customer",
                PasswordHash = "" // No password for OAuth
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else if (user.AuthProvider == "Local")
        {
            // Link existing local account to OAuth
            user.AuthProvider = request.Provider;
            user.ProviderId = verification.ProviderId;
            user.IsEmailVerified = true;
            await _db.SaveChangesAsync();
        }

        var token = _jwt.GenerateToken(user);
        return new LoginResult(LoginOutcome.Success,
            new AuthResponse(token, user.Role, user.Username, user.Id, user.RestaurantId));
    }

    public async Task<(RegisterResponse? Response, string? Error)> RegisterAsync(RegisterRequest request)
    {
        // Anti-enumeration: always return the same message whether the email is new, taken,
        // or the username clashes. The caller cannot distinguish these cases by HTTP shape.
        var emailTaken = await _db.Users.AnyAsync(u => u.Email == request.Email);
        var usernameTaken = await _db.Users.AnyAsync(u => u.Username == request.Username);

        if (!emailTaken && !usernameTaken)
        {
            var otp = GenerateOtp();
            var now = DateTime.UtcNow;
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = _hasher.Hash(request.Password),
                Role = "Customer",
                IsEmailVerified = false,
                OtpCode = otp,
                OtpExpiresAt = now.Add(OtpLifetime),
                OtpSentAt = now
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Enqueue via Hangfire — OTP send is retried automatically on Resend outage.
            _jobs.Enqueue<IEmailService>(s => s.SendOtpAsync(user.Email, user.Username, otp));
        }
        // Else: silently no-op. Real users still see the verify-email screen and can request
        // a resend if they mistyped; an attacker probing for existing accounts learns nothing.

        return (new RegisterResponse(request.Email, GenericRegisterAck), null);
    }

    public async Task<(AuthResponse? Response, string? Error)> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        // Single generic error so attackers cannot tell unknown-account from wrong-code.
        const string genericError = "Incorrect or expired code";

        if (user == null)
            return (null, genericError);
        if (user.IsEmailVerified)
            return (null, "Email already verified — please log in");
        if (user.OtpCode == null || user.OtpExpiresAt == null)
            return (null, genericError);
        if (DateTime.UtcNow > user.OtpExpiresAt)
            return (null, genericError);
        if (!FixedTimeEquals(user.OtpCode, request.Otp))
            return (null, genericError);

        user.IsEmailVerified = true;
        user.OtpCode = null;
        user.OtpExpiresAt = null;
        user.OtpSentAt = null;
        await _db.SaveChangesAsync();

        return (new AuthResponse(_jwt.GenerateToken(user), user.Role, user.Username, user.Id, user.RestaurantId), null);
    }

    public async Task<(bool Success, string? Error)> ResendOtpAsync(ResendOtpRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        // Anti-enumeration: always succeed. Only actually send when the account exists,
        // is unverified, and the cooldown window has passed.
        if (user != null && !user.IsEmailVerified)
        {
            var now = DateTime.UtcNow;
            var lastSent = user.OtpSentAt ?? DateTime.MinValue;
            if (now - lastSent >= OtpResendCooldown)
            {
                user.OtpCode = GenerateOtp();
                user.OtpExpiresAt = now.Add(OtpLifetime);
                user.OtpSentAt = now;
                await _db.SaveChangesAsync();
                var otpSnapshot = user.OtpCode; // capture before lambda serialisation
                _jobs.Enqueue<IEmailService>(s => s.SendOtpAsync(user.Email, user.Username, otpSnapshot));
            }
        }

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        // Anti-enumeration: always return success so attackers cannot confirm whether
        // an account exists for a given email address.
        if (user != null && user.IsEmailVerified)
        {
            var now = DateTime.UtcNow;
            var lastSent = user.OtpSentAt ?? DateTime.MinValue;
            if (now - lastSent >= OtpResendCooldown)
            {
                user.OtpCode = GenerateOtp();
                user.OtpExpiresAt = now.Add(OtpLifetime);
                user.OtpSentAt = now;
                await _db.SaveChangesAsync();
                var otpSnapshot = user.OtpCode;
                _jobs.Enqueue<IEmailService>(s => s.SendPasswordResetOtpAsync(user.Email, user.Username, otpSnapshot));
            }
        }

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        const string genericError = "Incorrect or expired code";

        if (user == null || !user.IsEmailVerified)
            return (false, genericError);
        if (user.OtpCode == null || user.OtpExpiresAt == null)
            return (false, genericError);
        if (DateTime.UtcNow > user.OtpExpiresAt)
            return (false, genericError);
        if (!FixedTimeEquals(user.OtpCode, request.Otp))
            return (false, genericError);

        user.PasswordHash = _hasher.Hash(request.NewPassword);
        user.OtpCode = null;
        user.OtpExpiresAt = null;
        user.OtpSentAt = null;
        await _db.SaveChangesAsync();

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return (false, "User not found");

        if (!_hasher.Verify(request.CurrentPassword, user.PasswordHash))
            return (false, "Current password is incorrect");

        user.PasswordHash = _hasher.Hash(request.NewPassword);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    // ── private ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Cryptographically-strong 6-digit OTP. RandomNumberGenerator is suitable for
    /// security-sensitive tokens; Random.Shared is not.
    /// </summary>
    private static string GenerateOtp() =>
        RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();

    /// <summary>
    /// Constant-time string comparison so an attacker cannot infer correct prefixes
    /// from response timing.
    /// </summary>
    private static bool FixedTimeEquals(string a, string b)
    {
        if (a.Length != b.Length) return false;
        return CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(a),
            System.Text.Encoding.UTF8.GetBytes(b));
    }
}


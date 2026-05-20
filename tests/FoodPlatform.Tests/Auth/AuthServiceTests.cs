using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services;
using FoodPlatform.Api.Services.Interfaces;
using FoodPlatform.Tests.Helpers;
using Hangfire;
using NSubstitute;
using Xunit;

namespace FoodPlatform.Tests.Auth;

/// <summary>
/// Unit tests for AuthService.
/// Uses EF InMemory for the DbContext; mocks IJwtTokenService, IPasswordHasher,
/// and IBackgroundJobClient so no real external calls are made.
/// </summary>
public class AuthServiceTests
{
    // ── Test doubles ────────────────────────────────────────────────────────

    private static AuthService BuildService(out FoodPlatform.Api.Data.FoodPlatformDbContext db)
    {
        db = DbFactory.Create();
        var jwt = Substitute.For<IJwtTokenService>();
        jwt.GenerateToken(Arg.Any<User>()).Returns("stub-token");

        var hasher = Substitute.For<IPasswordHasher>();
        hasher.Hash(Arg.Any<string>()).Returns(ci => "hash:" + ci.Arg<string>());
        hasher.Verify(Arg.Any<string>(), Arg.Any<string>())
              .Returns(ci => "hash:" + ci.ArgAt<string>(0) == ci.ArgAt<string>(1));

        var jobs = Substitute.For<IBackgroundJobClient>();

        return new AuthService(db, jwt, hasher, jobs);
    }

    // ── LoginAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_ValidVerifiedCredentials_ReturnsToken()
    {
        var svc = BuildService(out var db);
        db.Users.Add(new User
        {
            Email = "u@test.com", PasswordHash = "hash:correct",
            Username = "u", IsEmailVerified = true, Role = "Customer"
        });
        await db.SaveChangesAsync();

        var result = await svc.LoginAsync(new LoginRequest("u@test.com", "correct"));

        Assert.Equal(LoginOutcome.Success, result.Outcome);
        Assert.NotNull(result.Token);
        Assert.Equal("stub-token", result.Token!.Token);
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsInvalidCredentials()
    {
        var svc = BuildService(out var db);
        db.Users.Add(new User
        {
            Email = "u@test.com", PasswordHash = "hash:correct",
            Username = "u", IsEmailVerified = true, Role = "Customer"
        });
        await db.SaveChangesAsync();

        var result = await svc.LoginAsync(new LoginRequest("u@test.com", "wrong"));

        Assert.Equal(LoginOutcome.InvalidCredentials, result.Outcome);
        Assert.Null(result.Token);
    }

    [Fact]
    public async Task LoginAsync_UnverifiedUser_ReturnsEmailNotVerified()
    {
        var svc = BuildService(out var db);
        db.Users.Add(new User
        {
            Email = "u@test.com", PasswordHash = "hash:correct",
            Username = "u", IsEmailVerified = false, Role = "Customer"
        });
        await db.SaveChangesAsync();

        var result = await svc.LoginAsync(new LoginRequest("u@test.com", "correct"));

        Assert.Equal(LoginOutcome.EmailNotVerified, result.Outcome);
        Assert.Null(result.Token);
    }

    [Fact]
    public async Task LoginAsync_UnknownEmail_ReturnsInvalidCredentials()
    {
        var svc = BuildService(out var db);

        var result = await svc.LoginAsync(new LoginRequest("ghost@test.com", "pw"));

        Assert.Equal(LoginOutcome.InvalidCredentials, result.Outcome);
        Assert.Null(result.Token);
    }

    // ── RegisterAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task RegisterAsync_NewUniqueUser_CreatesUserInDbAndReturnsAck()
    {
        var svc = BuildService(out var db);

        var (resp, err) = await svc.RegisterAsync(
            new RegisterRequest("alice", "alice@test.com", "password123"));

        Assert.Null(err);
        Assert.NotNull(resp);
        Assert.Equal("alice@test.com", resp.Email);
        Assert.Single(await db.Users.ToListAsync());
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ReturnsAck_NoNewUser()
    {
        // Anti-enumeration: same response shape even when email is taken
        var svc = BuildService(out var db);
        db.Users.Add(new User { Email = "taken@test.com", Username = "existing", PasswordHash = "x" });
        await db.SaveChangesAsync();

        var (resp, err) = await svc.RegisterAsync(
            new RegisterRequest("newuser", "taken@test.com", "password123"));

        Assert.Null(err);
        Assert.NotNull(resp);
        Assert.Equal(1, await db.Users.CountAsync()); // no new row created
    }

    [Fact]
    public async Task RegisterAsync_DuplicateUsername_ReturnsAck_NoNewUser()
    {
        var svc = BuildService(out var db);
        db.Users.Add(new User { Email = "other@test.com", Username = "taken", PasswordHash = "x" });
        await db.SaveChangesAsync();

        var (resp, err) = await svc.RegisterAsync(
            new RegisterRequest("taken", "new@test.com", "password123"));

        Assert.Null(err);
        Assert.NotNull(resp);
        Assert.Equal(1, await db.Users.CountAsync());
    }

    // ── VerifyOtpAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task VerifyOtpAsync_CorrectUnexpiredOtp_VerifiesAndReturnsToken()
    {
        var svc = BuildService(out var db);
        db.Users.Add(new User
        {
            Email = "u@test.com", Username = "u", PasswordHash = "x",
            IsEmailVerified = false,
            OtpCode = "123456",
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(5)
        });
        await db.SaveChangesAsync();

        var (resp, err) = await svc.VerifyOtpAsync(new VerifyOtpRequest("u@test.com", "123456"));

        Assert.Null(err);
        Assert.NotNull(resp);
        Assert.Equal("stub-token", resp.Token);

        var user = await db.Users.FirstAsync();
        Assert.True(user.IsEmailVerified);
        Assert.Null(user.OtpCode);
    }

    [Fact]
    public async Task VerifyOtpAsync_WrongOtp_ReturnsGenericError()
    {
        var svc = BuildService(out var db);
        db.Users.Add(new User
        {
            Email = "u@test.com", Username = "u", PasswordHash = "x",
            IsEmailVerified = false, OtpCode = "123456",
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(5)
        });
        await db.SaveChangesAsync();

        var (resp, err) = await svc.VerifyOtpAsync(new VerifyOtpRequest("u@test.com", "999999"));

        Assert.Null(resp);
        Assert.Equal("Incorrect or expired code", err);
    }

    [Fact]
    public async Task VerifyOtpAsync_ExpiredOtp_ReturnsGenericError()
    {
        var svc = BuildService(out var db);
        db.Users.Add(new User
        {
            Email = "u@test.com", Username = "u", PasswordHash = "x",
            IsEmailVerified = false, OtpCode = "123456",
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(-1) // already expired
        });
        await db.SaveChangesAsync();

        var (resp, err) = await svc.VerifyOtpAsync(new VerifyOtpRequest("u@test.com", "123456"));

        Assert.Null(resp);
        Assert.Equal("Incorrect or expired code", err);
    }

    [Fact]
    public async Task VerifyOtpAsync_UnknownEmail_ReturnsGenericError()
    {
        var svc = BuildService(out var db);

        var (resp, err) = await svc.VerifyOtpAsync(new VerifyOtpRequest("ghost@test.com", "123456"));

        Assert.Null(resp);
        Assert.Equal("Incorrect or expired code", err);
    }

    [Fact]
    public async Task VerifyOtpAsync_AlreadyVerified_ReturnsSpecificError()
    {
        var svc = BuildService(out var db);
        db.Users.Add(new User
        {
            Email = "u@test.com", Username = "u", PasswordHash = "x",
            IsEmailVerified = true
        });
        await db.SaveChangesAsync();

        var (resp, err) = await svc.VerifyOtpAsync(new VerifyOtpRequest("u@test.com", "123456"));

        Assert.Null(resp);
        Assert.Contains("already verified", err);
    }

    // ── ResendOtpAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task ResendOtpAsync_UnknownEmail_ReturnsSuccess_AntiEnum()
    {
        // Anti-enumeration: unknown email must return success, not 404
        var svc = BuildService(out var db);

        var (success, err) = await svc.ResendOtpAsync(new ResendOtpRequest("ghost@test.com"));

        Assert.True(success);
        Assert.Null(err);
    }

    [Fact]
    public async Task ResendOtpAsync_AfterCooldown_UpdatesOtpAndSucceeds()
    {
        var svc = BuildService(out var db);
        var originalOtp = "111111";
        db.Users.Add(new User
        {
            Email = "u@test.com", Username = "u", PasswordHash = "x",
            IsEmailVerified = false,
            OtpCode = originalOtp,
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(5),
            OtpSentAt = DateTime.UtcNow.AddSeconds(-90) // well past 60s cooldown
        });
        await db.SaveChangesAsync();

        var (success, err) = await svc.ResendOtpAsync(new ResendOtpRequest("u@test.com"));

        Assert.True(success);
        var user = await db.Users.FirstAsync();
        Assert.NotEqual(originalOtp, user.OtpCode); // new OTP generated
    }

    [Fact]
    public async Task ResendOtpAsync_WithinCooldown_DoesNotChangeOtp()
    {
        var svc = BuildService(out var db);
        var originalOtp = "222222";
        db.Users.Add(new User
        {
            Email = "u@test.com", Username = "u", PasswordHash = "x",
            IsEmailVerified = false,
            OtpCode = originalOtp,
            OtpSentAt = DateTime.UtcNow.AddSeconds(-10) // only 10s ago — still in cooldown
        });
        await db.SaveChangesAsync();

        var (success, err) = await svc.ResendOtpAsync(new ResendOtpRequest("u@test.com"));

        Assert.True(success); // still returns success (anti-enum)
        var user = await db.Users.FirstAsync();
        Assert.Equal(originalOtp, user.OtpCode); // OTP unchanged
    }
}

// Needed for async LINQ in tests
file static class AsyncHelper
{
    public static Task<System.Collections.Generic.List<T>> ToListAsync<T>(
        this Microsoft.EntityFrameworkCore.DbSet<T> set) where T : class =>
        Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(set);

    public static Task<int> CountAsync<T>(
        this Microsoft.EntityFrameworkCore.DbSet<T> set) where T : class =>
        Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(set);

    public static Task<T> FirstAsync<T>(
        this Microsoft.EntityFrameworkCore.DbSet<T> set) where T : class =>
        Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstAsync(set);
}

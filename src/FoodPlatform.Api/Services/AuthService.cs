using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Handles authentication and registration.
/// (SRP: delegates JWT generation to IJwtTokenService and hashing to IPasswordHasher)
/// (DIP: depends on abstractions, not concrete BCrypt or EF DbContext for token logic)
/// </summary>
public class AuthService : IAuthService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IPasswordHasher _hasher;

    public AuthService(FoodPlatformDbContext db, IJwtTokenService jwt, IPasswordHasher hasher)
    {
        _db = db;
        _jwt = jwt;
        _hasher = hasher;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !_hasher.Verify(request.Password, user.PasswordHash))
            return null;

        return new AuthResponse(_jwt.GenerateToken(user), user.Role, user.Username, user.Id, user.RestaurantId);
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
            return null;

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _hasher.Hash(request.Password),
            Role = "Customer"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponse(_jwt.GenerateToken(user), user.Role, user.Username, user.Id, user.RestaurantId);
    }
}

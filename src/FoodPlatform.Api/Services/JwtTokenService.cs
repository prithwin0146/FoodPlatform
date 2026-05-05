using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Generates JWT tokens. (SRP: isolated from auth and hashing concerns)
/// </summary>
public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config) => _config = config;

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
        };

        if (user.RestaurantId.HasValue)
            claims.Add(new Claim("restaurantId", user.RestaurantId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

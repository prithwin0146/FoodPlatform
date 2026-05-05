using FoodPlatform.Api.Data.Entities;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Responsible solely for generating JWT tokens. (SRP: isolated cryptographic concern)
/// </summary>
public interface IJwtTokenService
{
    string GenerateToken(User user);
}

using FoodPlatform.Api.Services.Interfaces;

namespace FoodPlatform.Api.Services;

/// <summary>
/// BCrypt implementation of IPasswordHasher. (OCP: swap for Argon2 by providing a new implementation)
/// </summary>
public class BcryptPasswordHasher : IPasswordHasher
{
    public string Hash(string plaintext) => BCrypt.Net.BCrypt.HashPassword(plaintext);

    public bool Verify(string plaintext, string hash) => BCrypt.Net.BCrypt.Verify(plaintext, hash);
}

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Abstracts the password hashing algorithm. (OCP: swap BCrypt for Argon2 without touching AuthService)
/// </summary>
public interface IPasswordHasher
{
    string Hash(string plaintext);
    bool Verify(string plaintext, string hash);
}

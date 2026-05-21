namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Encrypts/decrypts integer IDs to/from opaque URL-safe strings using
/// ASP.NET Core Data Protection (AES-256-CBC + HMAC-SHA256).
/// The same ID produces a different ciphertext each call — ids cannot be
/// enumerated or reverse-engineered without the server's Data Protection key.
/// (SRP: ID encryption only — no auth or business logic)
/// (DIP: callers depend on this interface; the Data Protection implementation is injected)
/// </summary>
public interface IUrlEncryptionService
{
    /// <summary>Encrypts an integer id to a URL-safe opaque string.</summary>
    string Encrypt(int id);

    /// <summary>
    /// Decrypts an encrypted string back to the integer id.
    /// Returns null if the payload is invalid or tampered.
    /// </summary>
    int? Decrypt(string encryptedId);
}

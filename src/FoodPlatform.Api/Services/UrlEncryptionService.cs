using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.DataProtection;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Encrypts/decrypts integer PKs using ASP.NET Core Data Protection.
/// Unlike Hashids, Data Protection uses real AES-256-CBC + HMAC-SHA256 —
/// the same id produces a different ciphertext each call and cannot be
/// reverse-engineered without the server's managed key ring.
/// (SRP: ID encryption concern only)
/// (LSP: fully substitutable for IUrlEncryptionService in tests via mock)
/// </summary>
public class UrlEncryptionService : IUrlEncryptionService
{
    private readonly IDataProtector _protector;

    public UrlEncryptionService(IDataProtectionProvider dataProtectionProvider)
    {
        _protector = dataProtectionProvider.CreateProtector("UrlEncryption");
    }

    /// <inheritdoc />
    public string Encrypt(int id) => _protector.Protect(id.ToString());

    /// <inheritdoc />
    public int? Decrypt(string encryptedId)
    {
        try
        {
            var decrypted = _protector.Unprotect(encryptedId);
            return int.TryParse(decrypted, out var id) ? id : null;
        }
        catch
        {
            // CryptographicException: tampered, expired, or wrong key — treat as not found
            return null;
        }
    }
}

using FoodPlatform.Api.Services.Interfaces;
using HashidsNet;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Wraps the Hashids library to encode/decode integer PKs.
/// Salt is sourced from configuration so hashes are environment-specific
/// (dev hashes never clash with production).
/// (SRP: ID obfuscation only)
/// (LSP: fully substitutable for IHashIdService in tests via mock)
/// </summary>
public class HashIdService : IHashIdService
{
    private readonly Hashids _hashids;

    public HashIdService(IConfiguration config)
    {
        var rawSalt = config["HashIds:Salt"]
            ?? throw new InvalidOperationException(
                "HashIds:Salt is not configured. Set the HASHIDS__SALT environment variable.");

        // Reject the placeholder that ships in appsettings.json — if this reaches production
        // it means the Render env var was never set and hashes would be predictable.
        if (rawSalt.StartsWith("<") || rawSalt.Length < 16)
            throw new InvalidOperationException(
                "HashIds:Salt looks like the default placeholder. " +
                "Set a real random value in the HASHIDS__SALT environment variable.");

        var salt = rawSalt;
        var minLength = int.TryParse(config["HashIds:MinLength"], out var ml) ? ml : 6;
        _hashids = new Hashids(salt, minLength);
    }

    /// <inheritdoc />
    public string Encode(int id) => _hashids.Encode(id);

    /// <inheritdoc />
    public int? Decode(string hash)
    {
        var numbers = _hashids.Decode(hash);
        return numbers.Length == 1 ? numbers[0] : null;
    }
}

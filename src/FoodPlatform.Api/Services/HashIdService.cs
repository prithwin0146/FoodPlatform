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
        var salt = config["HashIds:Salt"]
            ?? throw new InvalidOperationException(
                "HashIds:Salt is not configured. Set the HASHIDS__SALT environment variable.");
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

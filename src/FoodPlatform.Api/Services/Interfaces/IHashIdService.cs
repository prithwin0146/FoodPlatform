namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Encodes/decodes integer IDs to/from opaque hash strings so that database
/// primary keys are never exposed in URLs or JSON responses.
/// (SRP: ID obfuscation only — no auth or business logic)
/// (DIP: callers depend on this interface; the Hashids implementation is injected)
/// </summary>
public interface IHashIdService
{
    /// <summary>Encodes a single integer id to a hash string (e.g. 42 → "Mj3").</summary>
    string Encode(int id);

    /// <summary>Decodes a hash string back to the integer id. Returns null if the hash is invalid.</summary>
    int? Decode(string hash);
}

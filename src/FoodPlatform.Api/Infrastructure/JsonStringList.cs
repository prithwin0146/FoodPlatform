using System.Text.Json;

namespace FoodPlatform.Api.Infrastructure;

/// <summary>
/// Helper for round-tripping a <c>List&lt;string&gt;</c> through a single nullable JSON column
/// (e.g. <c>MenuItem.DietaryTags</c>, <c>MenuItem.Allergens</c>).
/// Tolerant of legacy comma-separated values that may pre-date the JSON convention.
/// (SRP: only serializes/deserializes string-list JSON columns.)
/// </summary>
public static class JsonStringList
{
    /// <summary>Parses a JSON array string, comma-separated string, or null → always a non-null list.</summary>
    public static List<string> Parse(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return new List<string>();
        var trimmed = raw.Trim();

        if (trimmed.StartsWith('['))
        {
            try
            {
                var list = JsonSerializer.Deserialize<List<string>>(trimmed);
                return list?.Where(s => !string.IsNullOrWhiteSpace(s))
                            .Select(s => s.Trim())
                            .ToList() ?? new List<string>();
            }
            catch
            {
                // fall through to comma-split
            }
        }

        return trimmed.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                      .ToList();
    }

    /// <summary>Serializes a list to a compact JSON array, or null if empty.</summary>
    public static string? Serialize(List<string>? list)
    {
        if (list is null || list.Count == 0) return null;
        var clean = list.Where(s => !string.IsNullOrWhiteSpace(s))
                        .Select(s => s.Trim())
                        .ToList();
        return clean.Count == 0 ? null : JsonSerializer.Serialize(clean);
    }
}

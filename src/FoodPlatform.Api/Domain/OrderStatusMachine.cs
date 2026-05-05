namespace FoodPlatform.Api.Domain;

/// <summary>
/// Encapsulates valid order status transitions. (OCP: add new statuses here without touching controllers)
/// </summary>
public static class OrderStatusMachine
{
    private static readonly Dictionary<string, string> Progressions = new()
    {
        ["Pending"]        = "Accepted",
        ["Accepted"]       = "Preparing",
        ["Preparing"]      = "Cooking",
        ["Cooking"]        = "Packed",
        ["Packed"]         = "OutForDelivery",
        ["OutForDelivery"] = "Delivered"
    };

    /// <summary>Returns the next valid status, or null if there is none.</summary>
    public static string? Next(string current) =>
        Progressions.TryGetValue(current, out var next) ? next : null;

    /// <summary>Returns true only when transitioning to the immediate next status.</summary>
    public static bool CanTransition(string from, string to) =>
        Progressions.TryGetValue(from, out var next) && next == to;

    /// <summary>Ordered list of the happy-path statuses, suitable for progress indicators.</summary>
    public static readonly IReadOnlyList<string> HappyPath =
    [
        "Pending", "Accepted", "Preparing", "Cooking", "Packed", "OutForDelivery", "Delivered"
    ];
}

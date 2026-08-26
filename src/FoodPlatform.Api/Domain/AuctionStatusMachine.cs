namespace FoodPlatform.Api.Domain;

/// <summary>
/// Encapsulates valid auction lifecycle transitions. (OCP: add new statuses here without touching services)
/// Draft -> Scheduled -> Live -> Ended -> (Sold | Unsold)
/// </summary>
public static class AuctionStatusMachine
{
    public const string Draft = "Draft";
    public const string Scheduled = "Scheduled";
    public const string Live = "Live";
    public const string Ended = "Ended";
    public const string Sold = "Sold";
    public const string Unsold = "Unsold";

    private static readonly HashSet<string> TerminalStatuses = [Ended, Sold, Unsold];

    public static bool IsTerminal(string status) => TerminalStatuses.Contains(status);

    public static bool CanStart(string status) => status is Draft or Scheduled;

    public static bool CanBid(string status) => status == Live;

    /// <summary>Resolves the final status once bidding closes, based on whether any bid was placed.</summary>
    public static string ResolveFinal(bool hasBids) => hasBids ? Sold : Unsold;
}

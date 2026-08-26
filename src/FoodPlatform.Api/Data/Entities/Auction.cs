namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// A live-bidding auction hosted by a restaurant for a food item or special lot.
/// (SRP: auction data shape only — bidding/lifecycle logic lives in IAuctionService)
/// </summary>
public class Auction
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    /// <summary>Optional link to an existing menu item being auctioned.</summary>
    public int? MenuItemId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }

    public decimal StartingPrice { get; set; }
    /// <summary>Highest bid so far. Null until the first bid is placed.</summary>
    public decimal? CurrentBid { get; set; }
    /// <summary>Minimum amount a new bid must exceed the current bid by.</summary>
    public decimal BidIncrement { get; set; } = 1.00m;
    /// <summary>Optional instant-win price — placing a bid at/above this ends the auction immediately.</summary>
    public decimal? BuyNowPrice { get; set; }

    /// <summary>Angelcam Camera ID for the live auction video stream (separate from the kitchen "Go Live" stream).</summary>
    public string? CameraId { get; set; }

    /// <summary>Draft | Scheduled | Live | Ended | Sold | Unsold.</summary>
    public string Status { get; set; } = "Draft";

    public DateTime? StartsAt { get; set; }
    /// <summary>Authoritative end time — the single source of truth for the countdown. Extended on soft-close bids.</summary>
    public DateTime? EndsAt { get; set; }
    /// <summary>A bid placed within this many seconds of EndsAt pushes EndsAt forward by the same amount (anti-sniping).</summary>
    public int SoftCloseSeconds { get; set; } = 15;

    public int? WinningBidId { get; set; }
    public int? WinningUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Restaurant Restaurant { get; set; } = null!;
    public MenuItem? MenuItem { get; set; }
    public User? WinningUser { get; set; }
    public ICollection<Bid> Bids { get; set; } = [];
}

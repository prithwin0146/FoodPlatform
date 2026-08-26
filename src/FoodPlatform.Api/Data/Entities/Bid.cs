namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// A single bid placed against a live auction.
/// (SRP: immutable bid record — never updated after creation)
/// </summary>
public class Bid
{
    public int Id { get; set; }
    public int AuctionId { get; set; }
    public int UserId { get; set; }
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Auction Auction { get; set; } = null!;
    public User User { get; set; } = null!;
}

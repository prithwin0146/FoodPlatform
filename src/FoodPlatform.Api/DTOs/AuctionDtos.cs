using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// ── Auctions ────────────────────────────────────────────────────────────────

public record AuctionDto(
    int Id,
    int RestaurantId,
    string RestaurantName,
    int? MenuItemId,
    string Title,
    string? Description,
    string? ImageUrl,
    decimal StartingPrice,
    decimal? CurrentBid,
    decimal BidIncrement,
    decimal? BuyNowPrice,
    string? CameraId,
    string Status,
    DateTime? StartsAt,
    DateTime? EndsAt,
    int SoftCloseSeconds,
    int BidCount,
    string? WinningUserName,
    DateTime CreatedAt);

public record BidDto(
    int Id,
    int AuctionId,
    string BidderName,
    decimal Amount,
    DateTime CreatedAt);

public record CreateAuctionRequest(
    int? MenuItemId,
    [Required, MaxLength(200)] string Title,
    [MaxLength(1000)] string? Description,
    string? ImageUrl,
    [Range(0.01, 100000)] decimal StartingPrice,
    decimal? BidIncrement,
    decimal? BuyNowPrice,
    DateTime? StartsAt,
    DateTime? EndsAt,
    int? SoftCloseSeconds);

public record UpdateAuctionRequest(
    string? Title,
    string? Description,
    string? ImageUrl,
    decimal? StartingPrice,
    decimal? BidIncrement,
    decimal? BuyNowPrice,
    DateTime? EndsAt);

public record StartAuctionRequest(
    /// <summary>How long the auction should run for once started, in minutes. Defaults to 10.</summary>
    int? DurationMinutes);

public record SetAuctionCameraRequest(string? CameraId);

public record PlaceBidRequest(
    [Range(0.01, 100000)] decimal Amount);

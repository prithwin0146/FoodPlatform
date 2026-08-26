using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.Domain;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Hubs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Orchestrates live auction lifecycle: creation, starting, bidding (with soft-close
/// anti-sniping), and resolution. (SRP: auction business logic only)
/// (OCP: relies on AuctionStatusMachine for valid lifecycle transitions)
/// (DIP: controllers depend on IAuctionService, not DbContext)
/// </summary>
public class AuctionService : IAuctionService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IHubContext<AuctionHub> _hub;
    private readonly ILogger<AuctionService> _logger;

    public AuctionService(FoodPlatformDbContext db, IHubContext<AuctionHub> hub, ILogger<AuctionService> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public async Task<IEnumerable<AuctionDto>> GetLiveAsync()
    {
        await AutoFinalizeExpiredAsync(a => a.Status == AuctionStatusMachine.Live);

        return await _db.Auctions
            .Include(a => a.Restaurant)
            .Include(a => a.WinningUser)
            .Include(a => a.Bids)
            .Where(a => a.Status == AuctionStatusMachine.Live)
            .OrderBy(a => a.EndsAt)
            .Select(a => ToDto(a))
            .ToListAsync();
    }

    public async Task<AuctionDto?> GetByIdAsync(int id)
    {
        await AutoFinalizeExpiredAsync(a => a.Id == id);

        var auction = await _db.Auctions
            .Include(a => a.Restaurant)
            .Include(a => a.WinningUser)
            .Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == id);
        return auction is null ? null : ToDto(auction);
    }

    public async Task<IEnumerable<BidDto>> GetBidsAsync(int auctionId, int take = 50) =>
        await _db.Bids
            .Include(b => b.User)
            .Where(b => b.AuctionId == auctionId)
            .OrderByDescending(b => b.CreatedAt)
            .Take(take)
            .Select(b => new BidDto(b.Id, b.AuctionId, b.User.Username, b.Amount, b.CreatedAt))
            .ToListAsync();

    public async Task<IEnumerable<AuctionDto>> GetAllForRestaurantAsync(int restaurantId)
    {
        await AutoFinalizeExpiredAsync(a => a.RestaurantId == restaurantId);

        return await _db.Auctions
            .Include(a => a.Restaurant)
            .Include(a => a.WinningUser)
            .Include(a => a.Bids)
            .Where(a => a.RestaurantId == restaurantId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => ToDto(a))
            .ToListAsync();
    }

    public async Task<AuctionDto> CreateAsync(int restaurantId, CreateAuctionRequest request)
    {
        var auction = new Auction
        {
            RestaurantId = restaurantId,
            MenuItemId = request.MenuItemId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl,
            StartingPrice = request.StartingPrice,
            BidIncrement = request.BidIncrement is > 0 ? request.BidIncrement.Value : 1.00m,
            BuyNowPrice = request.BuyNowPrice,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            SoftCloseSeconds = request.SoftCloseSeconds is > 0 ? request.SoftCloseSeconds.Value : 15,
            Status = AuctionStatusMachine.Draft,
        };
        _db.Auctions.Add(auction);
        await _db.SaveChangesAsync();

        auction = await _db.Auctions.Include(a => a.Restaurant).Include(a => a.Bids)
            .FirstAsync(a => a.Id == auction.Id);
        return ToDto(auction);
    }

    public async Task<AuctionDto?> UpdateAsync(int id, int restaurantId, UpdateAuctionRequest request)
    {
        var auction = await _db.Auctions.Include(a => a.Restaurant).Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == id && a.RestaurantId == restaurantId);
        if (auction is null) return null;
        if (AuctionStatusMachine.IsTerminal(auction.Status)) return ToDto(auction);

        if (request.Title is not null) auction.Title = request.Title.Trim();
        if (request.Description is not null) auction.Description = request.Description.Trim();
        if (request.ImageUrl is not null) auction.ImageUrl = request.ImageUrl;
        if (request.StartingPrice.HasValue) auction.StartingPrice = request.StartingPrice.Value;
        if (request.BidIncrement.HasValue) auction.BidIncrement = request.BidIncrement.Value;
        if (request.BuyNowPrice.HasValue) auction.BuyNowPrice = request.BuyNowPrice.Value;
        if (request.EndsAt.HasValue) auction.EndsAt = request.EndsAt.Value;

        await _db.SaveChangesAsync();
        return ToDto(auction);
    }

    public async Task<AuctionDto?> SetCameraAsync(int id, int restaurantId, SetAuctionCameraRequest request)
    {
        var auction = await _db.Auctions.Include(a => a.Restaurant).Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == id && a.RestaurantId == restaurantId);
        if (auction is null) return null;

        auction.CameraId = string.IsNullOrWhiteSpace(request.CameraId) ? null : request.CameraId.Trim();
        await _db.SaveChangesAsync();

        var dto = ToDto(auction);
        await _hub.Clients.Group($"auction.{auction.Id}").SendAsync("AuctionUpdated", dto);
        return dto;
    }

    public async Task<AuctionDto?> StartAsync(int id, int restaurantId, StartAuctionRequest request)
    {
        var auction = await _db.Auctions.Include(a => a.Restaurant).Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == id && a.RestaurantId == restaurantId);
        if (auction is null) return null;
        if (!AuctionStatusMachine.CanStart(auction.Status)) return ToDto(auction);

        var minutes = request.DurationMinutes is > 0 ? request.DurationMinutes.Value : 10;
        auction.Status = AuctionStatusMachine.Live;
        auction.StartsAt = DateTime.UtcNow;
        auction.EndsAt = DateTime.UtcNow.AddMinutes(minutes);

        await _db.SaveChangesAsync();

        var dto = ToDto(auction);
        await _hub.Clients.Group($"restaurant-auctions.{restaurantId}").SendAsync("AuctionStarted", dto);
        await _hub.Clients.All.SendAsync("AuctionStarted", dto);
        return dto;
    }

    public async Task<AuctionDto?> EndAsync(int id, int restaurantId)
    {
        var auction = await _db.Auctions.Include(a => a.Restaurant).Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == id && a.RestaurantId == restaurantId);
        if (auction is null) return null;
        if (AuctionStatusMachine.IsTerminal(auction.Status)) return ToDto(auction);

        await FinalizeAsync(auction);
        return ToDto(auction);
    }

    public async Task<bool> DeleteAsync(int id, int restaurantId)
    {
        var auction = await _db.Auctions
            .FirstOrDefaultAsync(a => a.Id == id && a.RestaurantId == restaurantId);
        if (auction is null || auction.Status != AuctionStatusMachine.Draft) return false;
        _db.Auctions.Remove(auction);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<BidDto> PlaceBidAsync(int auctionId, int userId, PlaceBidRequest request)
    {
        var auction = await _db.Auctions
            .Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == auctionId)
            ?? throw new InvalidOperationException("Auction not found.");

        if (auction.Status == AuctionStatusMachine.Live && auction.EndsAt is not null && auction.EndsAt <= DateTime.UtcNow)
        {
            await FinalizeAsync(auction);
        }

        if (!AuctionStatusMachine.CanBid(auction.Status))
            throw new InvalidOperationException("This auction is not currently accepting bids.");

        var minAmount = (auction.CurrentBid ?? auction.StartingPrice - auction.BidIncrement) + auction.BidIncrement;
        if (request.Amount < minAmount)
            throw new InvalidOperationException($"Bid must be at least {minAmount:0.00}.");

        var bid = new Bid { AuctionId = auction.Id, UserId = userId, Amount = request.Amount };
        _db.Bids.Add(bid);

        auction.CurrentBid = request.Amount;
        auction.WinningUserId = userId;

        // Soft-close anti-sniping: a late bid pushes the deadline back so other bidders can respond.
        if (auction.EndsAt is not null)
        {
            var remaining = auction.EndsAt.Value - DateTime.UtcNow;
            if (remaining < TimeSpan.FromSeconds(auction.SoftCloseSeconds))
                auction.EndsAt = DateTime.UtcNow.AddSeconds(auction.SoftCloseSeconds);
        }

        var isBuyNow = auction.BuyNowPrice.HasValue && request.Amount >= auction.BuyNowPrice.Value;

        await _db.SaveChangesAsync();

        var user = await _db.Users.FirstAsync(u => u.Id == userId);
        var bidDto = new BidDto(bid.Id, bid.AuctionId, user.Username, bid.Amount, bid.CreatedAt);

        await _hub.Clients.Group($"auction.{auction.Id}").SendAsync("BidPlaced", bidDto);
        await _hub.Clients.Group($"restaurant-auctions.{auction.RestaurantId}").SendAsync("BidPlaced", bidDto);

        if (isBuyNow)
        {
            await FinalizeAsync(auction);
        }
        else
        {
            var dto = ToDto(auction);
            await _hub.Clients.Group($"auction.{auction.Id}").SendAsync("AuctionUpdated", dto);
        }

        return bidDto;
    }

    /// <summary>Finds any Live auctions matching the filter whose EndsAt has passed and resolves them.</summary>
    private async Task AutoFinalizeExpiredAsync(System.Linq.Expressions.Expression<Func<Auction, bool>> filter)
    {
        var now = DateTime.UtcNow;
        var expired = await _db.Auctions
            .Include(a => a.Bids)
            .Where(filter)
            .Where(a => a.Status == AuctionStatusMachine.Live && a.EndsAt != null && a.EndsAt <= now)
            .ToListAsync();

        foreach (var auction in expired)
        {
            await FinalizeAsync(auction);
        }
    }

    private async Task FinalizeAsync(Auction auction)
    {
        var hasBids = auction.Bids.Count > 0;
        auction.Status = AuctionStatusMachine.ResolveFinal(hasBids);
        if (hasBids)
        {
            var winningBid = auction.Bids.OrderByDescending(b => b.Amount).ThenBy(b => b.CreatedAt).First();
            auction.WinningBidId = winningBid.Id;
            auction.WinningUserId = winningBid.UserId;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Auction {AuctionId} resolved to {Status}", auction.Id, auction.Status);

        var dto = await BuildDtoWithNamesAsync(auction);
        await _hub.Clients.Group($"auction.{auction.Id}").SendAsync("AuctionEnded", dto);
        await _hub.Clients.Group($"restaurant-auctions.{auction.RestaurantId}").SendAsync("AuctionEnded", dto);
    }

    private async Task<AuctionDto> BuildDtoWithNamesAsync(Auction auction)
    {
        if (auction.Restaurant is null)
            await _db.Entry(auction).Reference(a => a.Restaurant).LoadAsync();
        if (auction.WinningUserId.HasValue && auction.WinningUser is null)
            await _db.Entry(auction).Reference(a => a.WinningUser).LoadAsync();
        return ToDto(auction);
    }

    private static AuctionDto ToDto(Auction a) => new(
        a.Id, a.RestaurantId, a.Restaurant?.Name ?? string.Empty, a.MenuItemId,
        a.Title, a.Description, a.ImageUrl,
        a.StartingPrice, a.CurrentBid, a.BidIncrement, a.BuyNowPrice,
        a.CameraId, a.Status, a.StartsAt, a.EndsAt, a.SoftCloseSeconds,
        a.Bids?.Count ?? 0, a.WinningUser?.Username, a.CreatedAt);
}

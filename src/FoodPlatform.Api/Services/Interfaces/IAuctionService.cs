using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Live auction bidding: staff manage auctions for their restaurant, customers browse and bid.
/// (ISP: staff-management methods take a restaurantId guard; public methods do not)
/// </summary>
public interface IAuctionService
{
    /// <summary>All currently Live auctions across every restaurant — customer browse grid.</summary>
    Task<IEnumerable<AuctionDto>> GetLiveAsync();

    /// <summary>Single auction by id, visible to anyone (customer live-bid page). Auto-finalizes if expired.</summary>
    Task<AuctionDto?> GetByIdAsync(int id);

    /// <summary>Most recent bids for an auction, newest first.</summary>
    Task<IEnumerable<BidDto>> GetBidsAsync(int auctionId, int take = 50);

    /// <summary>All auctions (any status) for a restaurant — staff dashboard view.</summary>
    Task<IEnumerable<AuctionDto>> GetAllForRestaurantAsync(int restaurantId);

    Task<AuctionDto> CreateAsync(int restaurantId, CreateAuctionRequest request);

    Task<AuctionDto?> UpdateAsync(int id, int restaurantId, UpdateAuctionRequest request);

    Task<AuctionDto?> SetCameraAsync(int id, int restaurantId, SetAuctionCameraRequest request);

    /// <summary>Transitions Draft/Scheduled -> Live and sets the countdown end time.</summary>
    Task<AuctionDto?> StartAsync(int id, int restaurantId, StartAuctionRequest request);

    /// <summary>Manually ends a live auction early — resolves to Sold or Unsold based on bid history.</summary>
    Task<AuctionDto?> EndAsync(int id, int restaurantId);

    Task<bool> DeleteAsync(int id, int restaurantId);

    /// <summary>
    /// Places a bid on behalf of the authenticated user. Validates increment, buy-now, and expiry,
    /// applies soft-close extension, and broadcasts the update over SignalR.
    /// </summary>
    Task<BidDto> PlaceBidAsync(int auctionId, int userId, PlaceBidRequest request);
}

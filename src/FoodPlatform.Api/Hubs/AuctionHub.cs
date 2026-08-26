using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FoodPlatform.Api.Hubs;

/// <summary>
/// Real-time WebSocket hub for live auction bidding.
/// (SRP: hub owns only connection/group management; business events pushed by IAuctionService via IHubContext)
/// (ISP: viewers join per-auction groups for bid updates; staff join a per-restaurant group for dashboard alerts)
/// </summary>
[Authorize]
public class AuctionHub : Hub
{
    /// <summary>Viewer joins a specific auction's live room to receive bid/timer/ended events.</summary>
    public async Task JoinAuctionGroup(int auctionId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"auction.{auctionId}");

    public async Task LeaveAuctionGroup(int auctionId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"auction.{auctionId}");

    /// <summary>Staff dashboard subscribes to all auction activity for their restaurant.</summary>
    public async Task JoinRestaurantAuctionGroup(int restaurantId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"restaurant-auctions.{restaurantId}");

    public async Task LeaveRestaurantAuctionGroup(int restaurantId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"restaurant-auctions.{restaurantId}");
}

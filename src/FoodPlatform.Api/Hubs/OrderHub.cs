using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FoodPlatform.Api.Hubs;

/// <summary>
/// Real-time WebSocket hub for order tracking and staff dashboard updates.
/// (SRP: hub owns only connection/group management; business events are pushed by services via IHubContext)
/// (ISP: customers join per-order groups; staff join per-restaurant groups — separate concerns)
/// </summary>
[Authorize]
public class OrderHub : Hub
{
    /// <summary>
    /// Customer calls this after navigating to /order/{hashId} to subscribe to status changes for their order.
    /// </summary>
    public async Task JoinOrderGroup(string hashId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"order.{hashId}");

    /// <summary>
    /// Customer leaves an order group (e.g. when navigating away).
    /// </summary>
    public async Task LeaveOrderGroup(string hashId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order.{hashId}");

    /// <summary>
    /// Staff/Admin calls this on dashboard load to receive all incoming order events for their restaurant.
    /// </summary>
    public async Task JoinRestaurantGroup(int restaurantId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"restaurant.{restaurantId}");

    /// <summary>
    /// Staff leaves the restaurant group (on dashboard unmount or logout).
    /// </summary>
    public async Task LeaveRestaurantGroup(int restaurantId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"restaurant.{restaurantId}");
}

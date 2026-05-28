using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Manages per-item stock tracking and auto-disable logic.
/// (SRP: inventory only; completely separate from menu CRUD and order placement)
/// </summary>
public interface IInventoryService
{
    /// <summary>Returns all inventory items for a restaurant (staff-scoped).</summary>
    Task<List<InventoryItemDto>> GetAllAsync(int restaurantId);
    /// <summary>Sets TrackStock + StockCount for a menu item. Auto-disables when count = 0.</summary>
    Task<InventoryItemDto?> SetStockAsync(int restaurantId, int itemId, SetStockRequest request);
    /// <summary>Decrements stock by <paramref name="quantity"/>. Auto-disables item when stock reaches 0. Called by OrderService.</summary>
    Task DecrementStockAsync(int menuItemId, int quantity);
}

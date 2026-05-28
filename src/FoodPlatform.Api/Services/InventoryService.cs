using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Manages per-item stock levels and auto-disables items when stock reaches zero.
/// (SRP: inventory mutation only)
/// (DIP: controllers depend on IInventoryService, not DbContext)
/// </summary>
public class InventoryService : IInventoryService
{
    private readonly FoodPlatformDbContext _db;

    public InventoryService(FoodPlatformDbContext db) => _db = db;

    public async Task<List<InventoryItemDto>> GetAllAsync(int restaurantId)
    {
        var items = await _db.MenuItems
            .Include(m => m.Category)
            .Where(m => m.RestaurantId == restaurantId && !m.IsDeleted)
            .OrderBy(m => m.Category.SortOrder)
            .ThenBy(m => m.Name)
            .ToListAsync();

        return items.Select(m => new InventoryItemDto(
            m.Id, m.Name, m.Category.Name, m.IsAvailable, m.TrackStock, m.StockCount))
            .ToList();
    }

    public async Task<InventoryItemDto?> SetStockAsync(int restaurantId, int itemId, SetStockRequest request)
    {
        var item = await _db.MenuItems
            .Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == itemId && m.RestaurantId == restaurantId && !m.IsDeleted);
        if (item is null) return null;

        item.TrackStock = request.TrackStock;
        item.StockCount = request.TrackStock ? request.StockCount : null;

        // Auto-disable when stock tracking is on and count is zero
        if (request.TrackStock && request.StockCount is 0)
            item.IsAvailable = false;
        else if (request.TrackStock && request.StockCount > 0)
            item.IsAvailable = true;

        await _db.SaveChangesAsync();
        return new InventoryItemDto(item.Id, item.Name, item.Category.Name, item.IsAvailable, item.TrackStock, item.StockCount);
    }

    public async Task DecrementStockAsync(int menuItemId, int quantity)
    {
        var item = await _db.MenuItems.FindAsync(menuItemId);
        if (item is null || !item.TrackStock || item.StockCount is null) return;

        item.StockCount = Math.Max(0, item.StockCount.Value - quantity);

        // Auto-disable when stock hits zero
        if (item.StockCount == 0)
            item.IsAvailable = false;

        await _db.SaveChangesAsync();
    }
}

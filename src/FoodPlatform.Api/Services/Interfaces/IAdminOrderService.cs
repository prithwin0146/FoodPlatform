using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Admin-specific order operations. (SRP: split from IAdminRestaurantService)
/// </summary>
public interface IAdminOrderService
{
    Task<IEnumerable<OrderDto>> GetAllAsync();
    Task<IEnumerable<OrderDto>> GetDisputedAsync();
    Task<object?> RefundAsync(int orderId);
}

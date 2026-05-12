using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Admin-specific order operations. (SRP: split from IAdminRestaurantService)
/// </summary>
public interface IAdminOrderService
{
    Task<PaginatedResult<OrderDto>> GetAllAsync(int page, int pageSize);
    Task<IEnumerable<OrderDto>> GetDisputedAsync();
    Task<object?> RefundAsync(int orderId);
    /// <summary>Mark dispute resolved without issuing a refund. (OCP: new action without modifying existing ones)</summary>
    Task<object?> ResolveAsync(int orderId);
}

using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

public enum OrderServiceError { NotFound, Unauthorized, InvalidTransition, WindowExpired, ValidationFailed }

public readonly record struct ServiceResult<T>(T? Value, OrderServiceError? Error, string? ErrorMessage)
{
    public bool IsSuccess => Error is null;
    public static ServiceResult<T> Ok(T value) => new(value, null, null);
    public static ServiceResult<T> Fail(OrderServiceError error, string message) => new(default, error, message);
}

/// <summary>
/// Orchestrates all order operations. (SRP: business logic extracted from controller)
/// </summary>
public interface IOrderService
{
    Task<ServiceResult<OrderDto>> PlaceOrderAsync(PlaceOrderRequest request, int userId);
    Task<OrderDto?> GetAsync(int id);
    Task<IEnumerable<OrderDto>> ListAsync(int? restaurantId, string? status);
    Task<IEnumerable<OrderDto>> ListForUserAsync(int userId);
    Task<PaginatedResult<OrderDto>> ListForUserPagedAsync(int userId, int page, int pageSize);
    Task<ServiceResult<object>> AcceptAsync(int id, int restaurantId, AcceptOrderRequest request);
    Task<ServiceResult<object>> RejectAsync(int id, int restaurantId, RejectOrderRequest request);
    Task<ServiceResult<object>> UpdateStatusAsync(int id, int restaurantId, UpdateStatusRequest request);
    Task<ServiceResult<object>> CancelAsync(int id, int userId);
    Task<ServiceResult<object>> DisputeAsync(int id, int userId, DisputeRequest request);
    /// <summary>Re-places a past order with the same items and delivery address.</summary>
    Task<ServiceResult<OrderDto>> ReorderAsync(int originalOrderId, int userId, string idempotencyKey);
}

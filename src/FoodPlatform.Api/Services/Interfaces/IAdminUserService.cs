using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Admin-only user management operations.
/// (SRP: separated from IAdminOrderService and IAdminRestaurantService)
/// (ISP: only the methods admin needs for user management — no auth/registration logic)
/// </summary>
public interface IAdminUserService
{
    /// <summary>Returns a paginated list of all registered users, newest first.</summary>
    Task<PaginatedResult<UserDto>> GetAllAsync(int page, int pageSize);

    /// <summary>Updates a user's role and optional restaurant assignment.
    /// Returns null when the update would violate admin-lockout rules (self-demotion, last-admin demotion, invalid RestaurantId).
    /// </summary>
    Task<UserDto?> UpdateUserAsync(int userId, UpdateUserRequest request, int callerUserId);
}

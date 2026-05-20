using FoodPlatform.Api.Data;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Admin-only user management operations.
/// (SRP: only owns user-list queries; auth/registration stays in AuthService)
/// (DIP: controllers inject IAdminUserService, not this class directly)
/// </summary>
public class AdminUserService : IAdminUserService
{
    private readonly FoodPlatformDbContext _db;

    public AdminUserService(FoodPlatformDbContext db) => _db = db;

    public async Task<PaginatedResult<UserDto>> GetAllAsync(int page, int pageSize)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = _db.Users.OrderByDescending(u => u.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(u => new UserDto(
            u.Id, u.Username, u.Email, u.Role,
            u.IsEmailVerified, u.RestaurantId, u.CreatedAt)).ToList();

        return new PaginatedResult<UserDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<UserDto?> UpdateUserAsync(int userId, UpdateUserRequest request, int callerUserId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return null;

        // S1-5a: Prevent admins from demoting themselves — avoid accidental lockout.
        if (userId == callerUserId && request.Role != "Admin")
            return null; // controller maps null to 400

        // S1-5b: Refuse to demote the last Admin — platform must always have at least one.
        if (user.Role == "Admin" && request.Role != "Admin")
        {
            var adminCount = await _db.Users.CountAsync(u => u.Role == "Admin");
            if (adminCount <= 1)
                return null;
        }

        // S1-5c: Staff must be linked to a real restaurant.
        if (request.Role == "Staff" && request.RestaurantId.HasValue)
        {
            var restaurantExists = await _db.Restaurants.AnyAsync(r => r.Id == request.RestaurantId.Value);
            if (!restaurantExists)
                return null;
        }

        user.Role         = request.Role;
        user.RestaurantId = request.Role == "Staff" ? request.RestaurantId : null;
        await _db.SaveChangesAsync();

        return new UserDto(user.Id, user.Username, user.Email, user.Role,
            user.IsEmailVerified, user.RestaurantId, user.CreatedAt);
    }
}

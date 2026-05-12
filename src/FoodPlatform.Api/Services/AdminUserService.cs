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
}

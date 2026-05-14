using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Handles review submission and retrieval.
/// (SRP: review logic only — no order state machine, no payment logic)
/// (DIP: depends on FoodPlatformDbContext abstraction via constructor injection)
/// </summary>
public class ReviewService : IReviewService
{
    private readonly FoodPlatformDbContext _db;

    public ReviewService(FoodPlatformDbContext db) => _db = db;

    public async Task<ServiceResult<ReviewDto>> SubmitAsync(int orderId, int customerId, SubmitReviewRequest request)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == customerId);
        if (order is null)
            return ServiceResult<ReviewDto>.Fail(OrderServiceError.NotFound, "Order not found");

        if (order.Status != "Delivered")
            return ServiceResult<ReviewDto>.Fail(OrderServiceError.InvalidTransition, "Reviews can only be left for delivered orders");

        var existing = await _db.Reviews.AnyAsync(r => r.OrderId == orderId && r.CustomerId == customerId);
        if (existing)
            return ServiceResult<ReviewDto>.Fail(OrderServiceError.ValidationFailed, "You have already reviewed this order");

        var review = new Review
        {
            OrderId    = orderId,
            CustomerId = customerId,
            RestaurantId = order.RestaurantId,
            Stars      = request.Stars,
            Comment    = request.Comment,
            CreatedAt  = DateTime.UtcNow,
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();

        // Load customer name for response
        var customerName = await _db.Users
            .Where(u => u.Id == customerId)
            .Select(u => u.Username)
            .FirstOrDefaultAsync() ?? "Customer";

        return ServiceResult<ReviewDto>.Ok(MapToDto(review, customerName));
    }

    public async Task<IEnumerable<ReviewDto>> ListForRestaurantAsync(int restaurantId)
    {
        return await _db.Reviews
            .Include(r => r.Customer)
            .Where(r => r.RestaurantId == restaurantId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto(r.Id, r.OrderId, r.Stars, r.Comment, r.Customer.Username, r.CreatedAt))
            .ToListAsync();
    }

    public async Task<ReviewDto?> GetByOrderAsync(int orderId, int customerId)
    {
        var review = await _db.Reviews
            .Include(r => r.Customer)
            .FirstOrDefaultAsync(r => r.OrderId == orderId && r.CustomerId == customerId);

        if (review is null) return null;
        return MapToDto(review, review.Customer.Username);
    }

    private static ReviewDto MapToDto(Review r, string customerName) =>
        new(r.Id, r.OrderId, r.Stars, r.Comment, customerName, r.CreatedAt);
}

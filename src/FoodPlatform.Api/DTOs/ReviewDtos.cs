using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: review DTOs isolated from restaurant/order DTOs)

public record SubmitReviewRequest(
    [Range(1, 5, ErrorMessage = "Stars must be between 1 and 5")] int Stars,
    [MaxLength(1000)] string? Comment);

public record ReviewDto(int Id, int OrderId, int Stars, string? Comment, string CustomerName, DateTime CreatedAt);

using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: menu DTOs isolated)
public record MenuCategoryDto(int Id, string Name, int SortOrder, List<MenuItemDto> Items);

public record MenuItemDto(int Id, int CategoryId, string Name, string? Description,
    decimal Price, string? Allergens, string? DietaryTags, bool IsAvailable, string? ImageUrl);

public record CreateMenuItemRequest(
    [Required] int CategoryId,
    [Required, MaxLength(100)] string Name,
    [MaxLength(500)] string? Description,
    [Required, Range(0.01, 9999.99, ErrorMessage = "Price must be between £0.01 and £9,999.99")]
    decimal Price,
    [MaxLength(500)] string? Allergens,
    [MaxLength(200)] string? DietaryTags,
    [MaxLength(500)] string? ImageUrl);

public record UpdateMenuItemRequest(
    int? CategoryId,
    [MaxLength(100)] string? Name,
    [MaxLength(500)] string? Description,
    [Range(0.01, 9999.99, ErrorMessage = "Price must be between £0.01 and £9,999.99")]
    decimal? Price,
    [MaxLength(500)] string? Allergens,
    [MaxLength(200)] string? DietaryTags,
    [MaxLength(500)] string? ImageUrl,
    bool? IsAvailable);

public record CreateCategoryRequest([Required, MaxLength(100)] string Name, int SortOrder);

/// <summary>Admin-only: create item for any restaurant (includes explicit restaurantId).</summary>
public record AdminCreateMenuItemRequest(
    [Required, Range(1, int.MaxValue, ErrorMessage = "A valid RestaurantId is required.")] int RestaurantId,
    [Required] int CategoryId,
    [Required, MaxLength(100)] string Name,
    [MaxLength(500)] string? Description,
    [Required, Range(0.01, 9999.99, ErrorMessage = "Price must be between £0.01 and £9,999.99")]
    decimal Price,
    [MaxLength(500)] string? Allergens,
    [MaxLength(200)] string? DietaryTags,
    [MaxLength(500)] string? ImageUrl);

/// <summary>Admin-only: update any item regardless of restaurant.</summary>
public record AdminUpdateMenuItemRequest(
    int? CategoryId,
    [MaxLength(100)] string? Name,
    [MaxLength(500)] string? Description,
    [Range(0.01, 9999.99, ErrorMessage = "Price must be between £0.01 and £9,999.99")]
    decimal? Price,
    [MaxLength(500)] string? Allergens,
    [MaxLength(200)] string? DietaryTags,
    [MaxLength(500)] string? ImageUrl,
    bool? IsAvailable);

public record AdminCreateCategoryRequest(
    [Required] int RestaurantId,
    [Required, MaxLength(100)] string Name,
    int SortOrder);

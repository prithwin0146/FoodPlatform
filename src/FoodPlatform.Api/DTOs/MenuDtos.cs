using System.ComponentModel.DataAnnotations;

namespace FoodPlatform.Api.DTOs;

// (SRP: menu DTOs isolated)
public record MenuCategoryDto(int Id, string Name, int SortOrder, List<MenuItemDto> Items);

public record MenuItemDto(int Id, int CategoryId, string Name, string? Description,
    decimal Price, string? Allergens, string? DietaryTags, bool IsAvailable, string? ImageUrl);

public record CreateMenuItemRequest(
    [Required] int CategoryId, [Required] string Name, string? Description,
    [Required] decimal Price, string? Allergens, string? DietaryTags, string? ImageUrl);

public record UpdateMenuItemRequest(int? CategoryId, string? Name, string? Description,
    decimal? Price, string? Allergens, string? DietaryTags, string? ImageUrl, bool? IsAvailable);

public record CreateCategoryRequest([Required] string Name, int SortOrder);

/// <summary>Admin-only: create item for any restaurant (includes explicit restaurantId).</summary>
public record AdminCreateMenuItemRequest(
    [Required] int RestaurantId, [Required] int CategoryId,
    [Required] string Name, string? Description,
    [Required] decimal Price, string? Allergens, string? DietaryTags, string? ImageUrl);

/// <summary>Admin-only: update any item regardless of restaurant.</summary>
public record AdminUpdateMenuItemRequest(
    int? CategoryId, string? Name, string? Description,
    decimal? Price, string? Allergens, string? DietaryTags,
    string? ImageUrl, bool? IsAvailable);

public record AdminCreateCategoryRequest([Required] int RestaurantId, [Required] string Name, int SortOrder);

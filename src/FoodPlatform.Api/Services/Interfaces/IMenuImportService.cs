using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Parses a CSV stream and bulk-creates menu categories and items.
/// (SRP: CSV parsing + item creation only; all HTTP concerns stay in the controller)
/// </summary>
public interface IMenuImportService
{
    /// <summary>
    /// Parses the CSV and creates items under the given restaurant.
    /// Expected CSV columns (header row required):
    ///   CategoryName, Name, Description, Price, Allergens, DietaryTags, ImageUrl
    /// Allergens and DietaryTags are pipe-separated (e.g. "gluten|milk").
    /// </summary>
    Task<MenuImportResult> ImportAsync(int restaurantId, Stream csvStream);
}

using System.Globalization;
using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Parses a CSV upload and bulk-creates menu categories and items for a restaurant.
/// (SRP: CSV ingestion only — no HTTP, no auth, no email)
/// (OCP: column mapping is table-driven; add new optional columns without touching callers)
/// </summary>
public class MenuImportService : IMenuImportService
{
    private readonly FoodPlatformDbContext _db;
    private readonly ILogger<MenuImportService> _logger;

    public MenuImportService(FoodPlatformDbContext db, ILogger<MenuImportService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// CSV columns (case-insensitive header row required):
    ///   CategoryName | Name | Description | Price | Allergens | DietaryTags | ImageUrl
    /// Allergens and DietaryTags are pipe-separated (e.g. "gluten|milk").
    /// Rows with a blank Name or unparseable Price are skipped with an error entry.
    /// </summary>
    public async Task<MenuImportResult> ImportAsync(int restaurantId, Stream csvStream)
    {
        var created = 0;
        var categoriesCreated = 0;
        var skipped = 0;
        var errors = new List<string>();

        // Load existing categories so we can match/create without hitting the DB per row
        var categoryCache = await _db.MenuCategories
            .Where(c => c.RestaurantId == restaurantId)
            .ToDictionaryAsync(c => c.Name.ToLowerInvariant());

        using var reader = new StreamReader(csvStream);
        string? headerLine = await reader.ReadLineAsync();
        if (string.IsNullOrWhiteSpace(headerLine))
            return new MenuImportResult(0, 0, 0, ["CSV file is empty or missing header row"]);

        var headers = headerLine.Split(',').Select(h => h.Trim().ToLowerInvariant()).ToArray();
        int ColIdx(string name) => Array.IndexOf(headers, name);

        int iCat  = ColIdx("categoryname");
        int iName = ColIdx("name");
        int iDesc = ColIdx("description");
        int iPrc  = ColIdx("price");
        int iAll  = ColIdx("allergens");
        int iDiet = ColIdx("dietarytags");
        int iImg  = ColIdx("imageurl");

        if (iName < 0 || iPrc < 0 || iCat < 0)
            return new MenuImportResult(0, 0, 0, ["CSV must contain columns: CategoryName, Name, Price"]);

        var lineNumber = 1;
        string? line;
        while ((line = await reader.ReadLineAsync()) is not null)
        {
            lineNumber++;
            if (string.IsNullOrWhiteSpace(line)) continue;

            var cols = SplitCsvLine(line);
            string Get(int idx) => idx >= 0 && idx < cols.Length ? cols[idx].Trim().Trim('"') : string.Empty;

            var catName  = Get(iCat);
            var itemName = Get(iName);
            var priceStr = Get(iPrc);

            if (string.IsNullOrWhiteSpace(itemName))
            {
                errors.Add($"Row {lineNumber}: Name is required — row skipped");
                skipped++; continue;
            }

            if (!decimal.TryParse(priceStr, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var price) || price <= 0)
            {
                errors.Add($"Row {lineNumber}: Invalid price '{priceStr}' for item '{itemName}' — row skipped");
                skipped++; continue;
            }

            // Resolve or create category
            if (string.IsNullOrWhiteSpace(catName)) catName = "General";
            var catKey = catName.ToLowerInvariant();
            if (!categoryCache.TryGetValue(catKey, out var category))
            {
                var maxSort = categoryCache.Values.Any()
                    ? categoryCache.Values.Max(c => c.SortOrder) + 1
                    : 0;
                category = new MenuCategory
                {
                    RestaurantId = restaurantId,
                    Name = catName,
                    SortOrder = maxSort,
                };
                _db.MenuCategories.Add(category);
                await _db.SaveChangesAsync(); // flush so we get the Id
                categoryCache[catKey] = category;
                categoriesCreated++;
            }

            var allergens = ParsePipeSeparated(Get(iAll));
            var dietaryTags = ParsePipeSeparated(Get(iDiet));

            var item = new MenuItem
            {
                RestaurantId = restaurantId,
                CategoryId   = category.Id,
                Name         = itemName,
                Description  = string.IsNullOrWhiteSpace(Get(iDesc)) ? null : Get(iDesc),
                Price        = price,
                Allergens    = allergens.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(allergens) : null,
                DietaryTags  = dietaryTags.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(dietaryTags) : null,
                ImageUrl     = string.IsNullOrWhiteSpace(Get(iImg)) ? null : Get(iImg),
                IsAvailable  = true,
            };
            _db.MenuItems.Add(item);
            created++;
        }

        if (created > 0)
            await _db.SaveChangesAsync();

        return new MenuImportResult(created, categoriesCreated, skipped, errors);
    }

    private static List<string> ParsePipeSeparated(string value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split('|').Select(s => s.Trim()).Where(s => s.Length > 0).ToList();

    /// <summary>Naive CSV line splitter — handles double-quoted fields with commas.</summary>
    private static string[] SplitCsvLine(string line)
    {
        var result = new List<string>();
        var inQuotes = false;
        var current = new System.Text.StringBuilder();
        foreach (var ch in line)
        {
            if (ch == '"') { inQuotes = !inQuotes; continue; }
            if (ch == ',' && !inQuotes) { result.Add(current.ToString()); current.Clear(); continue; }
            current.Append(ch);
        }
        result.Add(current.ToString());
        return result.ToArray();
    }
}

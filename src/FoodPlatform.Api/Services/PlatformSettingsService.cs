using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.Services.Interfaces;
using FoodPlatform.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Reads and writes platform-wide key-value settings via EF Core with caching.
/// (SRP: settings persistence + caching)
/// (DIP: consumers depend on IPlatformSettingsService, not this class)
/// </summary>
public class PlatformSettingsService : IPlatformSettingsService
{
    private readonly FoodPlatformDbContext _db;
    private readonly IMemoryCacheService _cache;

    public PlatformSettingsService(FoodPlatformDbContext db, IMemoryCacheService cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<Dictionary<string, string>> GetPublicSettingsAsync()
    {
        // Cache key for platform settings
        string cacheKey = "platform-settings";

        return await _cache.GetOrCreate(cacheKey, async entry =>
        {
            // Set cache expiration to 1 hour for platform settings (changes infrequently)
            entry.SetAbsoluteExpiration(TimeSpan.FromHours(1));

            var rows = await _db.PlatformSettings.AsNoTracking().ToListAsync();
            return rows.ToDictionary(r => r.Key, r => r.Value);
        });
    }

    public async Task UpsertSettingAsync(string key, string value)
    {
        var existing = await _db.PlatformSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (existing is null)
        {
            _db.PlatformSettings.Add(new PlatformSetting { Key = key, Value = value, UpdatedAt = DateTime.UtcNow });
        }
        else
        {
            existing.Value = value;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();

        // Invalidate cache when settings are updated
        _cache.Remove("platform-settings");
    }
}

using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Reads and writes platform-wide key-value settings via EF Core.
/// (SRP: settings persistence only)
/// (DIP: consumers depend on IPlatformSettingsService, not this class)
/// </summary>
public class PlatformSettingsService(FoodPlatformDbContext db) : IPlatformSettingsService
{
    public async Task<Dictionary<string, string>> GetPublicSettingsAsync()
    {
        var rows = await db.PlatformSettings.AsNoTracking().ToListAsync();
        return rows.ToDictionary(r => r.Key, r => r.Value);
    }

    public async Task UpsertSettingAsync(string key, string value)
    {
        var existing = await db.PlatformSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (existing is null)
        {
            db.PlatformSettings.Add(new PlatformSetting { Key = key, Value = value, UpdatedAt = DateTime.UtcNow });
        }
        else
        {
            existing.Value = value;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
    }
}

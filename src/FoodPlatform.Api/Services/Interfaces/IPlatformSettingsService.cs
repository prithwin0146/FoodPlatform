namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Contract for reading and writing platform-wide key-value settings.
/// (SRP: settings access only; ISP: no unrelated methods)
/// </summary>
public interface IPlatformSettingsService
{
    Task<Dictionary<string, string>> GetPublicSettingsAsync();
    Task UpsertSettingAsync(string key, string value);
}

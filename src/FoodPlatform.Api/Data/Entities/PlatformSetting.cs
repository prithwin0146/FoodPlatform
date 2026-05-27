namespace FoodPlatform.Api.Data.Entities;

/// <summary>
/// Key-value store for platform-wide settings (e.g. homepage demo video URL).
/// (SRP: settings persistence only — no business logic on this entity)
/// </summary>
public class PlatformSetting
{
    public int Id { get; set; }

    /// <summary>Unique machine-readable key, e.g. "homepage_demo_video".</summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>The stored value; empty string means "not set".</summary>
    public string Value { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

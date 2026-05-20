namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Fetches a fresh, time-limited HLS stream URL from the Angelcam API.
/// (SRP: owns only Angelcam API communication — no business logic)
/// (DIP: callers depend on this interface; the concrete HTTP details are hidden in AngelcamService)
/// </summary>
public interface IAngelcamService
{
    /// <summary>
    /// Returns the HLS playlist URL (with embedded auth token) for the given Angelcam camera ID,
    /// or null if the camera is offline or the API call fails.
    /// </summary>
    Task<string?> GetHlsUrlAsync(string cameraId);

    /// <summary>
    /// Removes the cached HLS URL for the given camera ID so the next call to
    /// <see cref="GetHlsUrlAsync"/> fetches a fresh, valid URL from the Angelcam API.
    /// Call this whenever a restaurant changes or removes its camera ID.
    /// </summary>
    void InvalidateCache(string cameraId);
}

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
}

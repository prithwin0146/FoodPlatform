using System.Text.Json;
using FoodPlatform.Api.Services.Interfaces;

namespace FoodPlatform.Api.Services;

/// <summary>
/// Calls the Angelcam REST API to obtain a fresh, short-lived HLS URL for a camera.
/// (SRP: owns only Angelcam HTTP communication)
/// (DIP: injected as IAngelcamService so callers never reference this concrete class)
/// </summary>
public class AngelcamService : IAngelcamService
{
    private readonly HttpClient _http;
    private readonly ILogger<AngelcamService> _logger;

    public AngelcamService(HttpClient http, ILogger<AngelcamService> logger)
    {
        _http = http;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<string?> GetHlsUrlAsync(string cameraId)
    {
        try
        {
            // Single camera endpoint returns the camera object with streams inline
            var response = await _http.GetAsync($"v1/cameras/{cameraId}/");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Angelcam API returned {Status} for camera {CameraId}",
                    response.StatusCode, cameraId);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Response is a single camera object: { "streams": [...], ... }
            IEnumerable<JsonElement> streams;
            if (root.TryGetProperty("streams", out var arr) && arr.ValueKind == JsonValueKind.Array)
            {
                streams = arr.EnumerateArray();
            }
            else
            {
                _logger.LogWarning("Angelcam API response for camera {CameraId} has no streams array", cameraId);
                return null;
            }

            foreach (var stream in streams)
            {
                if (stream.TryGetProperty("format", out var fmt) &&
                    fmt.GetString()?.Equals("hls", StringComparison.OrdinalIgnoreCase) == true &&
                    stream.TryGetProperty("url", out var url))
                {
                    return url.GetString();
                }
            }

            _logger.LogWarning("No HLS stream found for Angelcam camera {CameraId}", cameraId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch Angelcam HLS URL for camera {CameraId}", cameraId);
            return null;
        }
    }
}

namespace FoodPlatform.Api.Services.Interfaces;

public class OAuthVerificationResult
{
    public bool IsSuccessful { get; set; }
    public string? ErrorMessage { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
}

public interface IOAuthVerificationService
{
    Task<OAuthVerificationResult> VerifyGoogleTokenAsync(string idToken);
    Task<OAuthVerificationResult> VerifyAppleTokenAsync(string idToken);
}

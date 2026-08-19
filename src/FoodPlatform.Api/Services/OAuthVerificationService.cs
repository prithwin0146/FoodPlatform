using FoodPlatform.Api.Services.Interfaces;
using Google.Apis.Auth;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text.Json;

namespace FoodPlatform.Api.Services;

public class OAuthVerificationService : IOAuthVerificationService
{
    private readonly string _googleClientId;
    private readonly ILogger<OAuthVerificationService> _logger;
    private readonly HttpClient _httpClient;

    public OAuthVerificationService(IConfiguration config, ILogger<OAuthVerificationService> logger, HttpClient httpClient)
    {
        _googleClientId = config["Authentication:Google:ClientId"] ?? "";
        _logger = logger;
        _httpClient = httpClient;
    }

    public async Task<OAuthVerificationResult> VerifyGoogleTokenAsync(string idToken)
    {
        try
        {
            if (string.IsNullOrEmpty(_googleClientId))
            {
                _logger.LogWarning("Google ClientId is not configured.");
                return new OAuthVerificationResult { IsSuccessful = false, ErrorMessage = "Google login is currently unavailable." };
            }

            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _googleClientId }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            
            return new OAuthVerificationResult
            {
                IsSuccessful = true,
                Email = payload.Email,
                Name = payload.Name ?? payload.Email.Split('@')[0],
                ProviderId = payload.Subject
            };
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google JWT token.");
            return new OAuthVerificationResult { IsSuccessful = false, ErrorMessage = "Invalid Google token." };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying Google token.");
            return new OAuthVerificationResult { IsSuccessful = false, ErrorMessage = "An error occurred during Google login." };
        }
    }


}

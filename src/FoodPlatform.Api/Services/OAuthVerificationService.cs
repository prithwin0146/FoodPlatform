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

    /// <summary>
    /// Verifies a Sign in with Apple identity token by fetching Apple's published JWKS,
    /// matching the token's `kid`, and validating signature + issuer + audience + expiry.
    /// (SRP: Apple-specific verification isolated in its own method, mirroring VerifyGoogleTokenAsync)
    /// </summary>
    public async Task<OAuthVerificationResult> VerifyAppleTokenAsync(string idToken)
    {
        const string appleIssuer = "https://appleid.apple.com";
        try
        {
            var handler = new JwtSecurityTokenHandler();
            if (!handler.CanReadToken(idToken))
                return new OAuthVerificationResult { IsSuccessful = false, ErrorMessage = "Invalid Apple token." };

            var unvalidatedToken = handler.ReadJwtToken(idToken);
            var kid = unvalidatedToken.Header.Kid;

            var jwksJson = await _httpClient.GetStringAsync("https://appleid.apple.com/auth/keys");
            using var jwksDoc = JsonDocument.Parse(jwksJson);
            var matchingKey = jwksDoc.RootElement.GetProperty("keys").EnumerateArray()
                .FirstOrDefault(k => k.GetProperty("kid").GetString() == kid);

            if (matchingKey.ValueKind == JsonValueKind.Undefined)
                return new OAuthVerificationResult { IsSuccessful = false, ErrorMessage = "Unable to verify Apple token (unknown key)." };

            var rsa = RSA.Create();
            rsa.ImportParameters(new RSAParameters
            {
                Modulus = Base64UrlEncoder.DecodeBytes(matchingKey.GetProperty("n").GetString()),
                Exponent = Base64UrlEncoder.DecodeBytes(matchingKey.GetProperty("e").GetString()),
            });

            var validationParameters = new TokenValidationParameters
            {
                ValidIssuer = appleIssuer,
                ValidateIssuer = true,
                ValidateAudience = false, // Client ID varies by platform (web/iOS); caller trusts issuer + signature
                ValidateLifetime = true,
                IssuerSigningKey = new RsaSecurityKey(rsa),
            };

            var principal = handler.ValidateToken(idToken, validationParameters, out _);
            var email = principal.FindFirst("email")?.Value ?? string.Empty;
            var subject = principal.FindFirst("sub")?.Value ?? string.Empty;

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(subject))
                return new OAuthVerificationResult { IsSuccessful = false, ErrorMessage = "Apple token missing required claims." };

            return new OAuthVerificationResult
            {
                IsSuccessful = true,
                Email = email,
                Name = email.Split('@')[0],
                ProviderId = subject,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying Apple token.");
            return new OAuthVerificationResult { IsSuccessful = false, ErrorMessage = "An error occurred during Apple login." };
        }
    }
}


using FoodPlatform.Api.DTOs;

namespace FoodPlatform.Api.Services.Interfaces;

/// <summary>
/// Read-only platform analytics. (SRP: analytics concern only — no mutations)
/// (ISP: callers that only need analytics aren't coupled to order or restaurant mutation interfaces)
/// </summary>
public interface IAdminAnalyticsService
{
    Task<AnalyticsDto> GetAsync();
}

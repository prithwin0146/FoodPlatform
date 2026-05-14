namespace FoodPlatform.Api.DTOs;

/// <summary>Platform-level analytics snapshot. (SRP: read-only analytics shape, no mutation)</summary>
public record AnalyticsDto(
    int TotalOrders,
    int ActiveRestaurants,
    decimal TotalRevenue,
    decimal AvgOrderValue,
    Dictionary<string, int> OrdersByStatus,
    List<TopRestaurantDto> TopRestaurantsByRevenue);

public record TopRestaurantDto(int Id, string Name, decimal Revenue, int OrderCount);

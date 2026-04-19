namespace FoodPlatform.Api.Data.Entities;

public class RestaurantHours
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    public int DayOfWeek { get; set; }       // 0=Sun, 1=Mon ... 6=Sat
    public TimeSpan OpenTime { get; set; }
    public TimeSpan CloseTime { get; set; }
    public bool IsClosed { get; set; }

    // Navigation
    public Restaurant Restaurant { get; set; } = null!;
}

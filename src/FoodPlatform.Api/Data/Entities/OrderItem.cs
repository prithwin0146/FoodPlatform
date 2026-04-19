namespace FoodPlatform.Api.Data.Entities;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }   // Snapshot — never use live price

    // Navigation
    public Order Order { get; set; } = null!;
    public MenuItem MenuItem { get; set; } = null!;
}

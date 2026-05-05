using FoodPlatform.Api.Data;
using FoodPlatform.Api.Data.Entities;
using FoodPlatform.Api.DTOs;
using FoodPlatform.Api.Services;
using FoodPlatform.Api.Services.Interfaces;
using FoodPlatform.Tests.Helpers;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace FoodPlatform.Tests.Orders;

/// <summary>
/// Unit tests for OrderService business logic.
/// Uses EF InMemory for the DbContext; mocks IStripeService and IBackgroundJobClient.
/// </summary>
public class OrderServiceTests
{
    // ── Helpers ──────────────────────────────────────────────────────────────

    private static OrderService BuildService(out FoodPlatformDbContext db,
        IStripeService? stripe = null)
    {
        db = DbFactory.Create();
        stripe ??= Substitute.For<IStripeService>();
        stripe.VerifyPaymentSucceededAsync(Arg.Any<string>(), Arg.Any<decimal>())
              .Returns(true);
        var jobs = Substitute.For<IBackgroundJobClient>();
        return new OrderService(db, stripe, jobs);
    }

    /// <summary>Seeds a restaurant that is open 00:00–23:59 every day.</summary>
    private static async Task<Restaurant> SeedOpenRestaurantAsync(FoodPlatformDbContext db)
    {
        var restaurant = new Restaurant
        {
            Id = 1, Name = "Test Kitchen", Address = "1 Test St",
            BasePostcode = "SW1A1AA", IsActive = true,
            Hours = Enumerable.Range(0, 7).Select(d => new RestaurantHours
            {
                DayOfWeek = d,
                OpenTime = TimeSpan.Zero,
                CloseTime = new TimeSpan(23, 59, 0),
                IsClosed = false
            }).ToList()
        };
        db.Restaurants.Add(restaurant);
        await db.SaveChangesAsync();
        return restaurant;
    }

    /// <summary>Seeds a menu item belonging to the given restaurant.</summary>
    private static async Task<MenuItem> SeedMenuItemAsync(FoodPlatformDbContext db,
        int restaurantId, decimal price = 10m)
    {
        var category = new MenuCategory { RestaurantId = restaurantId, Name = "Mains", SortOrder = 1 };
        db.MenuCategories.Add(category);
        await db.SaveChangesAsync();

        var item = new MenuItem
        {
            RestaurantId = restaurantId, CategoryId = category.Id,
            Name = "Burger", Price = price, IsAvailable = true
        };
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    private static PlaceOrderRequest ValidRequest(int restaurantId, int menuItemId,
        string idempotencyKey = "key-1") =>
        new(restaurantId,
            [new OrderItemRequest(menuItemId, 2)],
            "1 High St", "London", "SW1A 1AA",
            idempotencyKey, null);

    // ── Postcode validation ──────────────────────────────────────────────────

    [Theory]
    [InlineData("NOT_A_POSTCODE")]
    [InlineData("1234")]
    [InlineData("SWSWSW")]
    public async Task PlaceOrderAsync_InvalidPostcode_FailsValidation(string postcode)
    {
        var svc = BuildService(out var db);
        await SeedOpenRestaurantAsync(db);
        var item = await SeedMenuItemAsync(db, 1);

        var req = new PlaceOrderRequest(1, [new(item.Id, 1)],
            "1 St", "London", postcode, "k1", null);
        var result = await svc.PlaceOrderAsync(req, userId: 99);

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.ValidationFailed, result.Error);
    }

    [Theory]
    [InlineData("SW1A 1AA")]
    [InlineData("SW1A1AA")]
    [InlineData("EC1A1BB")]
    [InlineData("W1A0AX")]
    [InlineData("M11AE")]
    public async Task PlaceOrderAsync_ValidPostcode_PassesRegex(string postcode)
    {
        var svc = BuildService(out var db);
        var restaurant = await SeedOpenRestaurantAsync(db);
        var item = await SeedMenuItemAsync(db, restaurant.Id);
        db.Users.Add(new User { Id = 1, Email = "c@c.com", Username = "c", PasswordHash = "x", IsEmailVerified = true, Role = "Customer" });
        await db.SaveChangesAsync();

        var req = new PlaceOrderRequest(restaurant.Id, [new(item.Id, 1)],
            "1 St", "London", postcode, Guid.NewGuid().ToString(), null);
        var result = await svc.PlaceOrderAsync(req, userId: 1);

        Assert.True(result.IsSuccess);
    }

    // ── Restaurant state ─────────────────────────────────────────────────────

    [Fact]
    public async Task PlaceOrderAsync_InactiveRestaurant_FailsValidation()
    {
        var svc = BuildService(out var db);
        db.Restaurants.Add(new Restaurant { Id = 1, Name = "Closed", IsActive = false });
        await db.SaveChangesAsync();

        var result = await svc.PlaceOrderAsync(
            new PlaceOrderRequest(1, [new(99, 1)], "1 St", "London", "SW1A 1AA", "k1", null),
            userId: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.ValidationFailed, result.Error);
    }

    [Fact]
    public async Task PlaceOrderAsync_ClosedHours_FailsValidation()
    {
        var svc = BuildService(out var db);
        var restaurant = new Restaurant
        {
            Id = 1, Name = "Night Owl", Address = "1 Dark St",
            BasePostcode = "SW1A1AA", IsActive = true,
            Hours = Enumerable.Range(0, 7).Select(d => new RestaurantHours
            {
                DayOfWeek = d, IsClosed = true,
                OpenTime = TimeSpan.Zero, CloseTime = TimeSpan.Zero
            }).ToList()
        };
        db.Restaurants.Add(restaurant);
        var item = await SeedMenuItemAsync(db, 1);
        await db.SaveChangesAsync();

        var result = await svc.PlaceOrderAsync(ValidRequest(1, item.Id), userId: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.ValidationFailed, result.Error);
    }

    // ── Menu item availability ────────────────────────────────────────────────

    [Fact]
    public async Task PlaceOrderAsync_UnavailableItem_FailsValidation()
    {
        var svc = BuildService(out var db);
        var restaurant = await SeedOpenRestaurantAsync(db);
        var category = new MenuCategory { RestaurantId = restaurant.Id, Name = "Mains", SortOrder = 1 };
        db.MenuCategories.Add(category);
        await db.SaveChangesAsync();
        var item = new MenuItem
        {
            RestaurantId = restaurant.Id, CategoryId = category.Id,
            Name = "Sold Out Item", Price = 5m, IsAvailable = false
        };
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();

        var result = await svc.PlaceOrderAsync(ValidRequest(restaurant.Id, item.Id), userId: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.ValidationFailed, result.Error);
    }

    // ── Successful placement ──────────────────────────────────────────────────

    [Fact]
    public async Task PlaceOrderAsync_ValidRequest_CreatesOrderAndSnapshotsPrice()
    {
        var svc = BuildService(out var db);
        var restaurant = await SeedOpenRestaurantAsync(db);
        var item = await SeedMenuItemAsync(db, restaurant.Id, price: 12.50m);
        db.Users.Add(new User { Id = 7, Email = "u@u.com", Username = "u", PasswordHash = "x", IsEmailVerified = true, Role = "Customer" });
        await db.SaveChangesAsync();

        var result = await svc.PlaceOrderAsync(ValidRequest(restaurant.Id, item.Id), userId: 7);

        Assert.True(result.IsSuccess);
        Assert.Equal(25.00m, result.Value!.TotalAmount); // 12.50 × 2
        Assert.Equal("Pending", result.Value.Status);

        var order = await db.Orders.Include(o => o.Items).FirstAsync();
        Assert.Single(order.Items);
        Assert.Equal(12.50m, order.Items.First().UnitPrice); // price snapshot
    }

    // ── Idempotency ───────────────────────────────────────────────────────────

    [Fact]
    public async Task PlaceOrderAsync_SameIdempotencyKey_ReturnsExistingOrder()
    {
        var svc = BuildService(out var db);
        var restaurant = await SeedOpenRestaurantAsync(db);
        var item = await SeedMenuItemAsync(db, restaurant.Id);
        db.Users.Add(new User { Id = 1, Email = "u@u.com", Username = "u", PasswordHash = "x", IsEmailVerified = true, Role = "Customer" });
        await db.SaveChangesAsync();

        var req = ValidRequest(restaurant.Id, item.Id, idempotencyKey: "idem-123");
        var first  = await svc.PlaceOrderAsync(req, userId: 1);
        var second = await svc.PlaceOrderAsync(req, userId: 1);

        Assert.True(first.IsSuccess);
        Assert.True(second.IsSuccess);
        Assert.Equal(first.Value!.Id, second.Value!.Id);
        Assert.Equal(1, await db.Orders.CountAsync()); // only one row
    }

    // ── Item deduplication ────────────────────────────────────────────────────

    [Fact]
    public async Task PlaceOrderAsync_DuplicateItemIds_MergesQuantities()
    {
        var svc = BuildService(out var db);
        var restaurant = await SeedOpenRestaurantAsync(db);
        var item = await SeedMenuItemAsync(db, restaurant.Id, price: 5m);
        db.Users.Add(new User { Id = 1, Email = "u@u.com", Username = "u", PasswordHash = "x", IsEmailVerified = true, Role = "Customer" });
        await db.SaveChangesAsync();

        // Same item sent twice — should be merged to qty 3
        var req = new PlaceOrderRequest(restaurant.Id,
            [new(item.Id, 1), new(item.Id, 2)],
            "1 St", "London", "SW1A 1AA", "dedup-key", null);
        var result = await svc.PlaceOrderAsync(req, userId: 1);

        Assert.True(result.IsSuccess);
        Assert.Equal(15m, result.Value!.TotalAmount); // 5 × 3

        var order = await db.Orders.Include(o => o.Items).FirstAsync();
        Assert.Single(order.Items);              // only one OrderItem row
        Assert.Equal(3, order.Items.First().Quantity);
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CancelAsync_WithinWindow_Succeeds()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 1, Status = "Pending",
            CancellableUntil = DateTime.UtcNow.AddMinutes(5),
            StripePaymentIntentId = "mock_pi_test",
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await svc.CancelAsync(order.Id, userId: 1);

        Assert.True(result.IsSuccess);
        var saved = await db.Orders.FindAsync(order.Id);
        Assert.Equal("Cancelled", saved!.Status);
    }

    [Fact]
    public async Task CancelAsync_WindowExpired_Fails()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 1, Status = "Pending",
            CancellableUntil = DateTime.UtcNow.AddMinutes(-1), // expired
            StripePaymentIntentId = "mock_pi_test",
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await svc.CancelAsync(order.Id, userId: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.WindowExpired, result.Error);
    }

    [Fact]
    public async Task CancelAsync_WrongUser_Fails()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 1, Status = "Pending",
            CancellableUntil = DateTime.UtcNow.AddMinutes(5),
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await svc.CancelAsync(order.Id, userId: 999); // different user

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.Unauthorized, result.Error);
    }

    // ── Dispute ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task DisputeAsync_Within48Hours_Succeeds()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 1, Status = "Delivered",
            DeliveredAt = DateTime.UtcNow.AddHours(-24), // 24h ago — within window
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await svc.DisputeAsync(order.Id, userId: 1, new DisputeRequest("Food was cold and wrong."));

        Assert.True(result.IsSuccess);
        var saved = await db.Orders.FindAsync(order.Id);
        Assert.Equal("Open", saved!.DisputeStatus);
    }

    [Fact]
    public async Task DisputeAsync_After48Hours_Fails()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 1, Status = "Delivered",
            DeliveredAt = DateTime.UtcNow.AddHours(-49), // expired
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await svc.DisputeAsync(order.Id, userId: 1, new DisputeRequest("Too late but trying."));

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.WindowExpired, result.Error);
    }

    [Fact]
    public async Task DisputeAsync_NonDeliveredOrder_Fails()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 1, Status = "Preparing",
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await svc.DisputeAsync(order.Id, userId: 1, new DisputeRequest("Not delivered yet."));

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.InvalidTransition, result.Error);
    }

    // ── UpdateStatus / state machine ─────────────────────────────────────────

    [Fact]
    public async Task UpdateStatusAsync_ValidTransition_UpdatesStatus()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 5, Status = "Accepted",
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await svc.UpdateStatusAsync(order.Id, restaurantId: 5,
            new UpdateStatusRequest("Preparing"));

        Assert.True(result.IsSuccess);
        var saved = await db.Orders.FindAsync(order.Id);
        Assert.Equal("Preparing", saved!.Status);
    }

    [Fact]
    public async Task UpdateStatusAsync_InvalidTransition_Fails()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 5, Status = "Pending",
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        // Pending → Delivered skips steps
        var result = await svc.UpdateStatusAsync(order.Id, restaurantId: 5,
            new UpdateStatusRequest("Delivered"));

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.InvalidTransition, result.Error);
    }

    [Fact]
    public async Task UpdateStatusAsync_ToDelivered_StampsDeliveredAt()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 5, Status = "OutForDelivery",
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var before = DateTime.UtcNow;
        var result = await svc.UpdateStatusAsync(order.Id, restaurantId: 5,
            new UpdateStatusRequest("Delivered"));
        var after = DateTime.UtcNow;

        Assert.True(result.IsSuccess);
        var saved = await db.Orders.FindAsync(order.Id);
        Assert.NotNull(saved!.DeliveredAt);
        Assert.InRange(saved.DeliveredAt!.Value, before, after);
    }

    [Fact]
    public async Task UpdateStatusAsync_WrongRestaurant_Fails()
    {
        var svc = BuildService(out var db);
        var order = new Order
        {
            UserId = 1, RestaurantId = 5, Status = "Accepted",
            IdempotencyKey = "k", TotalAmount = 10m,
            DeliveryAddressLine1 = "1 St", DeliveryCity = "London", DeliveryPostcode = "SW1A1AA"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await svc.UpdateStatusAsync(order.Id, restaurantId: 999,
            new UpdateStatusRequest("Preparing"));

        Assert.False(result.IsSuccess);
        Assert.Equal(OrderServiceError.Unauthorized, result.Error);
    }
}

// EF async LINQ helpers scoped to this file
file static class AsyncHelper
{
    public static Task<T?> FindAsync<T>(
        this Microsoft.EntityFrameworkCore.DbSet<T> set, params object[] keys) where T : class =>
        set.FindAsync(keys).AsTask();

    public static Task<int> CountAsync<T>(
        this Microsoft.EntityFrameworkCore.DbSet<T> set) where T : class =>
        Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(set);

    public static Task<T> FirstAsync<T>(
        this Microsoft.EntityFrameworkCore.DbSet<T> set) where T : class =>
        Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstAsync(set);
}

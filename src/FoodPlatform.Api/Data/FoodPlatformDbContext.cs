using FoodPlatform.Api.Data.Entities;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Data;

/// <summary>
/// Thin DbContext: delegates schema configuration to IEntityTypeConfiguration classes
/// and seed data to DataSeeder. (SRP: only owns the DbSet registrations and wiring)
/// (OCP: new entities are picked up automatically via ApplyConfigurationsFromAssembly)
/// Implements IDataProtectionKeyContext so ASP.NET Core Data Protection keys are
/// persisted in PostgreSQL — survives Render container restarts / redeployments.
/// </summary>
public class FoodPlatformDbContext : DbContext, IDataProtectionKeyContext
{
    public FoodPlatformDbContext(DbContextOptions<FoodPlatformDbContext> options) : base(options) { }

    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<RestaurantHours> RestaurantHours => Set<RestaurantHours>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ProcessedStripeEvent> ProcessedStripeEvents => Set<ProcessedStripeEvent>();
    // Required by IDataProtectionKeyContext — keys stored in "DataProtectionKeys" table
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Picks up all IEntityTypeConfiguration<T> in this assembly automatically (OCP)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FoodPlatformDbContext).Assembly);
        DataSeeder.Seed(modelBuilder);
    }
}

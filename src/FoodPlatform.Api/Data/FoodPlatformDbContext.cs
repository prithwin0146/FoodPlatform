using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace FoodPlatform.Api.Data;

public class FoodPlatformDbContext : DbContext
{
    public FoodPlatformDbContext(DbContextOptions<FoodPlatformDbContext> options) : base(options) { }

    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<RestaurantHours> RestaurantHours => Set<RestaurantHours>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Restaurant
        modelBuilder.Entity<Restaurant>(e =>
        {
            e.Property(r => r.Name).HasMaxLength(200).IsRequired();
            e.Property(r => r.Address).HasMaxLength(500).IsRequired();
            e.Property(r => r.BasePostcode).HasMaxLength(10).IsRequired();
            e.Property(r => r.StripeAccountId).HasMaxLength(100);
            e.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // RestaurantHours
        modelBuilder.Entity<RestaurantHours>(e =>
        {
            e.HasOne(h => h.Restaurant).WithMany(r => r.Hours)
                .HasForeignKey(h => h.RestaurantId);
        });

        // MenuCategory
        modelBuilder.Entity<MenuCategory>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(100).IsRequired();
            e.HasOne(c => c.Restaurant).WithMany(r => r.MenuCategories)
                .HasForeignKey(c => c.RestaurantId);
        });

        // MenuItem
        modelBuilder.Entity<MenuItem>(e =>
        {
            e.Property(i => i.Name).HasMaxLength(200).IsRequired();
            e.Property(i => i.Description).HasMaxLength(500);
            e.Property(i => i.Price).HasColumnType("decimal(10,2)");
            e.Property(i => i.Allergens).HasMaxLength(500);
            e.Property(i => i.DietaryTags).HasMaxLength(200);
            e.Property(i => i.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(i => i.Restaurant).WithMany(r => r.MenuItems)
                .HasForeignKey(i => i.RestaurantId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(i => i.Category).WithMany(c => c.Items)
                .HasForeignKey(i => i.CategoryId);
        });

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.Property(u => u.Role).HasMaxLength(50).IsRequired();
            e.Property(u => u.Email).HasMaxLength(200).IsRequired();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(u => u.Restaurant).WithMany(r => r.Staff)
                .HasForeignKey(u => u.RestaurantId);
        });

        // Order
        modelBuilder.Entity<Order>(e =>
        {
            e.Property(o => o.Status).HasMaxLength(50).IsRequired().HasDefaultValue("Pending");
            e.Property(o => o.RejectionReason).HasMaxLength(200);
            e.Property(o => o.DisputeStatus).HasMaxLength(50).IsRequired().HasDefaultValue("None");
            e.Property(o => o.DisputeNotes).HasMaxLength(1000);
            e.Property(o => o.TotalAmount).HasColumnType("decimal(10,2)");
            e.Property(o => o.StripePaymentIntentId).HasMaxLength(200);
            e.Property(o => o.IdempotencyKey).HasMaxLength(200).IsRequired();
            e.Property(o => o.DeliveryAddressLine1).HasMaxLength(300).IsRequired();
            e.Property(o => o.DeliveryCity).HasMaxLength(100).IsRequired();
            e.Property(o => o.DeliveryPostcode).HasMaxLength(10).IsRequired();
            e.Property(o => o.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            e.HasOne(o => o.Restaurant).WithMany(r => r.Orders)
                .HasForeignKey(o => o.RestaurantId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(o => o.User).WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        // OrderItem
        modelBuilder.Entity<OrderItem>(e =>
        {
            e.Property(oi => oi.UnitPrice).HasColumnType("decimal(10,2)");
            e.HasOne(oi => oi.Order).WithMany(o => o.Items)
                .HasForeignKey(oi => oi.OrderId);
            e.HasOne(oi => oi.MenuItem).WithMany()
                .HasForeignKey(oi => oi.MenuItemId).OnDelete(DeleteBehavior.NoAction);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Seed 1 test restaurant
        modelBuilder.Entity<Restaurant>().HasData(new Restaurant
        {
            Id = 1,
            Name = "Spice Garden",
            Address = "42 High Street, Westminster, London",
            BasePostcode = "SW1A 1AA",
            DeliveryRadiusMiles = 3.0,
            HygieneRating = 5,
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        // Opening hours — Mon-Sat open, Sun closed
        var hours = new List<RestaurantHours>();
        for (int day = 0; day <= 6; day++)
        {
            hours.Add(new RestaurantHours
            {
                Id = day + 1,
                RestaurantId = 1,
                DayOfWeek = day,
                OpenTime = new TimeSpan(11, 0, 0),
                CloseTime = new TimeSpan(23, 0, 0),
                IsClosed = day == 0  // Closed on Sunday
            });
        }
        modelBuilder.Entity<RestaurantHours>().HasData(hours);

        // Menu categories
        modelBuilder.Entity<MenuCategory>().HasData(
            new MenuCategory { Id = 1, RestaurantId = 1, Name = "Starters", SortOrder = 0 },
            new MenuCategory { Id = 2, RestaurantId = 1, Name = "Mains", SortOrder = 1 },
            new MenuCategory { Id = 3, RestaurantId = 1, Name = "Sides", SortOrder = 2 },
            new MenuCategory { Id = 4, RestaurantId = 1, Name = "Drinks", SortOrder = 3 }
        );

        // Menu items
        modelBuilder.Entity<MenuItem>().HasData(
            new MenuItem { Id = 1, RestaurantId = 1, CategoryId = 1, Name = "Onion Bhaji", Description = "Crispy onion fritters", Price = 4.50m, Allergens = "[\"gluten\"]", DietaryTags = "[\"vegan\"]", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new MenuItem { Id = 2, RestaurantId = 1, CategoryId = 1, Name = "Samosa", Description = "Vegetable samosa (2 pieces)", Price = 3.95m, Allergens = "[\"gluten\"]", DietaryTags = "[\"vegan\"]", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new MenuItem { Id = 3, RestaurantId = 1, CategoryId = 2, Name = "Chicken Tikka Masala", Description = "Creamy tomato-based curry", Price = 11.95m, Allergens = "[\"milk\"]", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new MenuItem { Id = 4, RestaurantId = 1, CategoryId = 2, Name = "Lamb Rogan Josh", Description = "Slow-cooked lamb in rich sauce", Price = 13.50m, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new MenuItem { Id = 5, RestaurantId = 1, CategoryId = 2, Name = "Chana Masala", Description = "Chickpea curry", Price = 9.50m, DietaryTags = "[\"vegan\",\"gluten-free\"]", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new MenuItem { Id = 6, RestaurantId = 1, CategoryId = 3, Name = "Pilau Rice", Price = 3.00m, DietaryTags = "[\"vegan\",\"gluten-free\"]", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new MenuItem { Id = 7, RestaurantId = 1, CategoryId = 3, Name = "Garlic Naan", Price = 2.50m, Allergens = "[\"gluten\",\"milk\"]", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new MenuItem { Id = 8, RestaurantId = 1, CategoryId = 4, Name = "Mango Lassi", Price = 3.50m, Allergens = "[\"milk\"]", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );

        // Seed users: 1 admin, 1 staff, 1 customer
        // Password for all: "Password123!" — hashed with BCrypt
        var hash = "$2a$11$0LsKfOUQyc/QVHi4nqC0DOEGZBe2nr3wjziMa/SNbly9ONtxGSrim";
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Role = "Admin", Email = "admin@foodplatform.co.uk", PasswordHash = hash, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new User { Id = 2, RestaurantId = 1, Role = "Staff", Email = "staff@spicegarden.co.uk", PasswordHash = hash, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new User { Id = 3, Role = "Customer", Email = "customer@example.com", PasswordHash = hash, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}

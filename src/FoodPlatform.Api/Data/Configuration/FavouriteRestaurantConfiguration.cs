using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>
/// EF Core schema for the FavouriteRestaurant join table.
/// (SRP: schema concerns isolated from the entity)
/// </summary>
public class FavouriteRestaurantConfiguration : IEntityTypeConfiguration<FavouriteRestaurant>
{
    public void Configure(EntityTypeBuilder<FavouriteRestaurant> e)
    {
        // Composite primary key — one row per user-restaurant pair
        e.HasKey(f => new { f.UserId, f.RestaurantId });

        e.Property(f => f.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(f => f.User).WithMany()
            .HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.Cascade);

        e.HasOne(f => f.Restaurant).WithMany()
            .HasForeignKey(f => f.RestaurantId).OnDelete(DeleteBehavior.Cascade);

        // Performance: quickly list all favourites for a user
        e.HasIndex(f => f.UserId).HasDatabaseName("IX_FavouriteRestaurants_UserId");
    }
}

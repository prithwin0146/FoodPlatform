using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>
/// EF Core schema configuration for the Review entity.
/// (SRP: schema concerns isolated from the entity class and business logic)
/// </summary>
public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> e)
    {
        e.Property(r => r.Stars).IsRequired();
        e.Property(r => r.Comment).HasMaxLength(1000);
        e.Property(r => r.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(r => r.Order).WithMany()
            .HasForeignKey(r => r.OrderId).OnDelete(DeleteBehavior.NoAction);
        e.HasOne(r => r.Customer).WithMany()
            .HasForeignKey(r => r.CustomerId).OnDelete(DeleteBehavior.NoAction);
        e.HasOne(r => r.Restaurant).WithMany()
            .HasForeignKey(r => r.RestaurantId).OnDelete(DeleteBehavior.NoAction);

        // One review per order (customers can't review the same order twice)
        e.HasIndex(r => r.OrderId).IsUnique()
            .HasDatabaseName("IX_Reviews_OrderId_Unique");

        // Performance: public restaurant review listing (newest first)
        e.HasIndex(r => new { r.RestaurantId, r.CreatedAt })
            .IsDescending(false, true)
            .HasDatabaseName("IX_Reviews_RestaurantId_CreatedAt_Desc");
    }
}

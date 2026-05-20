using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> e)
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
        e.Property(o => o.CreatedAt).HasDefaultValueSql("NOW()");
        e.HasOne(o => o.Restaurant).WithMany(r => r.Orders)
            .HasForeignKey(o => o.RestaurantId).OnDelete(DeleteBehavior.NoAction);
        e.HasOne(o => o.User).WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.NoAction);

        // Idempotency: prevent duplicate orders from concurrent requests with same key
        e.HasIndex(o => new { o.IdempotencyKey, o.UserId }).IsUnique()
            .HasDatabaseName("IX_Orders_IdempotencyKey_UserId");

        // Performance: customer order history page (sorted by newest first)
        e.HasIndex(o => new { o.UserId, o.CreatedAt })
            .IsDescending(false, true)
            .HasDatabaseName("IX_Orders_UserId_CreatedAt_Desc");

        // Performance: restaurant staff dashboard filtering by status
        e.HasIndex(o => new { o.RestaurantId, o.Status })
            .HasDatabaseName("IX_Orders_RestaurantId_Status");

        // Optimistic concurrency: uses PostgreSQL's built-in xmin system column
        // so no extra column is needed. EF checks xmin on UPDATE to detect races.
        e.Property(o => o.RowVersion).HasColumnName("xmin").HasColumnType("xid").IsRowVersion();
    }
}

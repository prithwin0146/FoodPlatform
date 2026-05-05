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
        e.Property(o => o.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        e.HasOne(o => o.Restaurant).WithMany(r => r.Orders)
            .HasForeignKey(o => o.RestaurantId).OnDelete(DeleteBehavior.NoAction);
        e.HasOne(o => o.User).WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.NoAction);
    }
}

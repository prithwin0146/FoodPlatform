using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> e)
    {
        e.Property(oi => oi.UnitPrice).HasColumnType("decimal(10,2)");
        e.HasOne(oi => oi.Order).WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId);
        e.HasOne(oi => oi.MenuItem).WithMany()
            .HasForeignKey(oi => oi.MenuItemId).OnDelete(DeleteBehavior.NoAction);
    }
}

using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> e)
    {
        e.Property(i => i.Name).HasMaxLength(200).IsRequired();
        e.Property(i => i.Description).HasMaxLength(500);
        e.Property(i => i.Price).HasColumnType("decimal(10,2)");
        e.Property(i => i.Allergens).HasMaxLength(500);
        e.Property(i => i.DietaryTags).HasMaxLength(200);
        e.Property(i => i.CreatedAt).HasDefaultValueSql("NOW()");
        e.HasOne(i => i.Restaurant).WithMany(r => r.MenuItems)
            .HasForeignKey(i => i.RestaurantId).OnDelete(DeleteBehavior.NoAction);
        e.HasOne(i => i.Category).WithMany(c => c.Items)
            .HasForeignKey(i => i.CategoryId);
    }
}

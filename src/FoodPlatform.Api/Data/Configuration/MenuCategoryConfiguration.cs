using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

public class MenuCategoryConfiguration : IEntityTypeConfiguration<MenuCategory>
{
    public void Configure(EntityTypeBuilder<MenuCategory> e)
    {
        e.Property(c => c.Name).HasMaxLength(100).IsRequired();
        e.HasOne(c => c.Restaurant).WithMany(r => r.MenuCategories)
            .HasForeignKey(c => c.RestaurantId);
    }
}

using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>EF Core schema for restaurant-level promotions.</summary>
public class RestaurantPromotionConfiguration : IEntityTypeConfiguration<RestaurantPromotion>
{
    public void Configure(EntityTypeBuilder<RestaurantPromotion> e)
    {
        e.Property(p => p.Title).HasMaxLength(200).IsRequired();
        e.Property(p => p.Description).HasMaxLength(500);
        e.Property(p => p.DiscountType).HasMaxLength(20);
        e.Property(p => p.DiscountValue).HasPrecision(10, 2);
        e.Property(p => p.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(p => p.Restaurant).WithMany()
            .HasForeignKey(p => p.RestaurantId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne(p => p.AppliesToCategory).WithMany()
            .HasForeignKey(p => p.AppliesToCategoryId).OnDelete(DeleteBehavior.SetNull);

        e.HasIndex(p => p.RestaurantId).HasDatabaseName("IX_RestaurantPromotions_RestaurantId");
    }
}

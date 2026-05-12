using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>(SRP: Restaurant schema configuration isolated from other entities and seeding)</summary>
public class RestaurantConfiguration : IEntityTypeConfiguration<Restaurant>
{
    public void Configure(EntityTypeBuilder<Restaurant> e)
    {
        e.Property(r => r.Name).HasMaxLength(200).IsRequired();
        e.Property(r => r.Address).HasMaxLength(500).IsRequired();
        e.Property(r => r.BasePostcode).HasMaxLength(10).IsRequired();
        e.Property(r => r.StripeAccountId).HasMaxLength(100);
        e.Property(r => r.KitchenVideoUrl).HasMaxLength(1000);
        e.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
    }
}

using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>
/// EF Core schema for promo codes and their usage audit trail.
/// (SRP: schema concerns isolated from entity classes)
/// </summary>
public class PromoCodeConfiguration : IEntityTypeConfiguration<PromoCode>
{
    public void Configure(EntityTypeBuilder<PromoCode> e)
    {
        e.Property(p => p.Code).HasMaxLength(50).IsRequired();
        e.HasIndex(p => p.Code).IsUnique().HasDatabaseName("IX_PromoCodes_Code");
        e.Property(p => p.Description).HasMaxLength(500);
        e.Property(p => p.DiscountType).HasMaxLength(20);
        e.Property(p => p.DiscountValue).HasPrecision(10, 2);
        e.Property(p => p.MinOrderAmount).HasPrecision(10, 2);
        e.Property(p => p.CreatedAt).HasDefaultValueSql("NOW()");
    }
}

public class PromoCodeUsageConfiguration : IEntityTypeConfiguration<PromoCodeUsage>
{
    public void Configure(EntityTypeBuilder<PromoCodeUsage> e)
    {
        e.Property(p => p.DiscountApplied).HasPrecision(10, 2);
        e.Property(p => p.UsedAt).HasDefaultValueSql("NOW()");

        e.HasOne(p => p.PromoCode).WithMany(c => c.Usages)
            .HasForeignKey(p => p.PromoCodeId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne(p => p.User).WithMany()
            .HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne(p => p.Order).WithMany()
            .HasForeignKey(p => p.OrderId).OnDelete(DeleteBehavior.Cascade);

        e.HasIndex(p => new { p.UserId, p.PromoCodeId }).HasDatabaseName("IX_PromoCodeUsages_User_Code");
    }
}

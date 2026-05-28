using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>EF Core schema for gift cards and their redemption history.</summary>
public class GiftCardConfiguration : IEntityTypeConfiguration<GiftCard>
{
    public void Configure(EntityTypeBuilder<GiftCard> e)
    {
        e.Property(p => p.Code).HasMaxLength(20).IsRequired();
        e.HasIndex(p => p.Code).IsUnique().HasDatabaseName("IX_GiftCards_Code");
        e.Property(p => p.InitialAmount).HasPrecision(10, 2);
        e.Property(p => p.RemainingBalance).HasPrecision(10, 2);
        e.Property(p => p.StripePaymentIntentId).HasMaxLength(200);
        e.Property(p => p.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(p => p.PurchasedByUser).WithMany()
            .HasForeignKey(p => p.PurchasedByUserId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class GiftCardUsageConfiguration : IEntityTypeConfiguration<GiftCardUsage>
{
    public void Configure(EntityTypeBuilder<GiftCardUsage> e)
    {
        e.Property(p => p.AmountUsed).HasPrecision(10, 2);
        e.Property(p => p.UsedAt).HasDefaultValueSql("NOW()");

        e.HasOne(p => p.GiftCard).WithMany(g => g.Usages)
            .HasForeignKey(p => p.GiftCardId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne(p => p.Order).WithMany()
            .HasForeignKey(p => p.OrderId).OnDelete(DeleteBehavior.Cascade);
    }
}

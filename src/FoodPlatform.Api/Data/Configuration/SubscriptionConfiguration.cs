using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>EF Core schema for SeeThePrep Plus subscriptions.</summary>
public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> e)
    {
        e.Property(p => p.StripeSubscriptionId).HasMaxLength(200).IsRequired();
        e.Property(p => p.StripeCustomerId).HasMaxLength(200).IsRequired();
        e.Property(p => p.Status).HasMaxLength(20);
        e.Property(p => p.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(p => p.User).WithMany()
            .HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);

        // One active subscription per user
        e.HasIndex(p => p.UserId).HasDatabaseName("IX_Subscriptions_UserId");
        e.HasIndex(p => p.StripeSubscriptionId).IsUnique().HasDatabaseName("IX_Subscriptions_StripeId");
    }
}

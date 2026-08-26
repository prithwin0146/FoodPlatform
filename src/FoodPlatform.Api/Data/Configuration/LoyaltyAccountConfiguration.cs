using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>EF Core schema for free loyalty accounts (SeeThePrep Rewards).</summary>
public class LoyaltyAccountConfiguration : IEntityTypeConfiguration<LoyaltyAccount>
{
    public void Configure(EntityTypeBuilder<LoyaltyAccount> e)
    {
        e.Property(l => l.AccountCreditBalance).HasPrecision(10, 2);
        e.Property(l => l.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(l => l.User).WithMany()
            .HasForeignKey(l => l.UserId).OnDelete(DeleteBehavior.Cascade);

        e.HasIndex(l => l.UserId).IsUnique().HasDatabaseName("IX_LoyaltyAccounts_UserId");
    }
}

using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>EF Core schema for loyalty transaction audit trail.</summary>
public class LoyaltyTransactionConfiguration : IEntityTypeConfiguration<LoyaltyTransaction>
{
    public void Configure(EntityTypeBuilder<LoyaltyTransaction> e)
    {
        e.Property(t => t.Type).HasMaxLength(30).IsRequired();
        e.Property(t => t.Amount).HasPrecision(10, 2);
        e.Property(t => t.Note).HasMaxLength(200);
        e.Property(t => t.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(t => t.LoyaltyAccount).WithMany(l => l.Transactions)
            .HasForeignKey(t => t.LoyaltyAccountId).OnDelete(DeleteBehavior.Cascade);

        e.HasIndex(t => t.LoyaltyAccountId).HasDatabaseName("IX_LoyaltyTransactions_LoyaltyAccountId");
    }
}

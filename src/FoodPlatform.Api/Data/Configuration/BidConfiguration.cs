using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>EF Core schema for auction bids.</summary>
public class BidConfiguration : IEntityTypeConfiguration<Bid>
{
    public void Configure(EntityTypeBuilder<Bid> e)
    {
        e.Property(b => b.Amount).HasPrecision(10, 2);
        e.Property(b => b.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(b => b.Auction).WithMany(a => a.Bids)
            .HasForeignKey(b => b.AuctionId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne(b => b.User).WithMany()
            .HasForeignKey(b => b.UserId).OnDelete(DeleteBehavior.Cascade);

        e.HasIndex(b => b.AuctionId).HasDatabaseName("IX_Bids_AuctionId");
    }
}

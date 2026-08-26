using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

/// <summary>EF Core schema for live-bidding auctions.</summary>
public class AuctionConfiguration : IEntityTypeConfiguration<Auction>
{
    public void Configure(EntityTypeBuilder<Auction> e)
    {
        e.Property(a => a.Title).HasMaxLength(200).IsRequired();
        e.Property(a => a.Description).HasMaxLength(1000);
        e.Property(a => a.Status).HasMaxLength(20);
        e.Property(a => a.StartingPrice).HasPrecision(10, 2);
        e.Property(a => a.CurrentBid).HasPrecision(10, 2);
        e.Property(a => a.BidIncrement).HasPrecision(10, 2);
        e.Property(a => a.BuyNowPrice).HasPrecision(10, 2);
        e.Property(a => a.CreatedAt).HasDefaultValueSql("NOW()");

        e.HasOne(a => a.Restaurant).WithMany()
            .HasForeignKey(a => a.RestaurantId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne(a => a.MenuItem).WithMany()
            .HasForeignKey(a => a.MenuItemId).OnDelete(DeleteBehavior.SetNull);
        e.HasOne(a => a.WinningUser).WithMany()
            .HasForeignKey(a => a.WinningUserId).OnDelete(DeleteBehavior.SetNull);

        e.HasIndex(a => a.RestaurantId).HasDatabaseName("IX_Auctions_RestaurantId");
        e.HasIndex(a => a.Status).HasDatabaseName("IX_Auctions_Status");
    }
}

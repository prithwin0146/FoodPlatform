using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> e)
    {
        e.Property(u => u.Role).HasMaxLength(50).IsRequired();
        e.Property(u => u.Username).HasMaxLength(50).IsRequired();
        e.HasIndex(u => u.Username).IsUnique();
        e.Property(u => u.Email).HasMaxLength(200).IsRequired();
        e.HasIndex(u => u.Email).IsUnique();
        e.Property(u => u.PasswordHash).HasMaxLength(500).IsRequired();
        e.Property(u => u.CreatedAt).HasDefaultValueSql("NOW()");
        e.HasOne(u => u.Restaurant).WithMany(r => r.Staff)
            .HasForeignKey(u => u.RestaurantId);
    }
}

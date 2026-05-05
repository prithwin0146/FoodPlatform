using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

public class RestaurantHoursConfiguration : IEntityTypeConfiguration<RestaurantHours>
{
    public void Configure(EntityTypeBuilder<RestaurantHours> e)
    {
        e.HasOne(h => h.Restaurant).WithMany(r => r.Hours)
            .HasForeignKey(h => h.RestaurantId);
    }
}

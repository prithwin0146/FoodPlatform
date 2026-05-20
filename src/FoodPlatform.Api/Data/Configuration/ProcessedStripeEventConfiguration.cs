using FoodPlatform.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FoodPlatform.Api.Data.Configuration;

public class ProcessedStripeEventConfiguration : IEntityTypeConfiguration<ProcessedStripeEvent>
{
    public void Configure(EntityTypeBuilder<ProcessedStripeEvent> e)
    {
        e.HasKey(x => x.EventId);
        e.Property(x => x.EventId).HasMaxLength(255).IsRequired();
        e.Property(x => x.ProcessedAt).HasDefaultValueSql("NOW()");
    }
}

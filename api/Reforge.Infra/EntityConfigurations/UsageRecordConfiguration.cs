using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class UsageRecordConfiguration : IEntityTypeConfiguration<UsageRecord>
{
    public void Configure(EntityTypeBuilder<UsageRecord> builder)
    {
        builder.ToTable("UsageRecords");
        builder.HasKey(u => u.Id);

        // Foreign-key-shaped field, not the primary key — a user has many usage records (one per
        // action per calendar month). Same text/opaque-OIDC-sub mapping as
        // ChatMessageConfiguration/CheckoutSessionConfiguration.
        builder.Property(u => u.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(u => u.Action).HasConversion<string>().HasMaxLength(50);
        builder.Property(u => u.Month).HasColumnType("date");
        builder.Property(u => u.Count);

        // One row per (user, action, month) — backs both GetCountAsync's lookup and
        // IncrementAsync's upsert.
        builder.HasIndex(u => new { u.UserId, u.Action, u.Month }).IsUnique();
    }
}

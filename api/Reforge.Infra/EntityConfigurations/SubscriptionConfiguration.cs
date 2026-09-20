using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.ToTable("Subscriptions");
        builder.HasKey(s => s.UserId);

        // 1:1 with User, keyed by the same opaque OIDC "sub" — mirrors
        // ReminderSettingsConfiguration/UserProfileConfiguration.
        builder.Property(s => s.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(s => s.Tier).IsRequired().HasMaxLength(50);
        builder.Property(s => s.Status).IsRequired().HasMaxLength(50);
        builder.Property(s => s.CurrentPeriodEnd).HasColumnType("timestamp with time zone");
        builder.Property(s => s.UpdatedAt).HasColumnType("timestamp with time zone");
    }
}

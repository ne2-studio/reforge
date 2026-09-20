using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Reminders.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class ReminderSettingsConfiguration : IEntityTypeConfiguration<ReminderSettings>
{
    public void Configure(EntityTypeBuilder<ReminderSettings> builder)
    {
        builder.ToTable("ReminderSettings");
        builder.HasKey(s => s.UserId);

        // 1:1 with User, keyed by the same opaque OIDC "sub" — mirrors UserProfileConfiguration.
        builder.Property(s => s.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(s => s.Enabled);
        builder.Property(s => s.Channel).IsRequired();
        builder.Property(s => s.DefaultTime).IsRequired();
        builder.Property(s => s.UpdatedAt).HasColumnType("timestamp with time zone");
    }
}

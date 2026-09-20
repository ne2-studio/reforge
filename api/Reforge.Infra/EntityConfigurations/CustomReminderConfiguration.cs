using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Reminders.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class CustomReminderConfiguration : IEntityTypeConfiguration<CustomReminder>
{
    public void Configure(EntityTypeBuilder<CustomReminder> builder)
    {
        builder.ToTable("CustomReminders");
        builder.HasKey(r => r.Id);

        // Foreign-key-shaped field, not the primary key — a user has many custom reminders. Same
        // text/opaque-OIDC-sub mapping as MeasurementConfiguration.
        builder.Property(r => r.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(r => r.Label).IsRequired();
        builder.Property(r => r.Time).IsRequired();
        builder.Property(r => r.Enabled);
        builder.Property(r => r.UpdatedAt).HasColumnType("timestamp with time zone");

        // No native EF Core/Npgsql mapping for List<string> — round-tripped through
        // System.Text.Json, same as UserProfileConfiguration.TrainingDays. A ValueComparer is
        // required so EF's change tracking compares contents rather than reference identity.
        builder.Property(r => r.DaysOfWeek)
            .HasColumnType("jsonb")
            .HasConversion(
                value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
                json => JsonSerializer.Deserialize<List<string>>(json, (JsonSerializerOptions?)null) ?? new List<string>())
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (a, b) => (a ?? new List<string>()).SequenceEqual(b ?? new List<string>()),
                a => a.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
                a => a.ToList()));

        // Backs GetByUserIdAsync's scoping.
        builder.HasIndex(r => r.UserId);
    }
}

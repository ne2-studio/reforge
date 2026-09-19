using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Profiles.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("UserProfiles");
        builder.HasKey(p => p.UserId);

        // 1:1 with User, keyed by the same opaque OIDC "sub" — see UserId's own doc comment and
        // UserConfiguration, which this mirrors.
        builder.Property(p => p.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(p => p.Age);
        builder.Property(p => p.Gender);
        builder.Property(p => p.Height);
        builder.Property(p => p.Weight);
        builder.Property(p => p.ActivityLevel);
        builder.Property(p => p.Goal);
        builder.Property(p => p.TrainingType);
        builder.Property(p => p.TrainingTime);
        builder.Property(p => p.Restrictions);
        builder.Property(p => p.CalorieTarget);
        builder.Property(p => p.UpdatedAt).HasColumnType("timestamp with time zone");

        // No native EF Core/Npgsql mapping exists for List<string>/Dictionary<string, object?>
        // (unlike, say, primitive arrays) — round-tripped through System.Text.Json instead, same
        // as the source schema's training_days/extra_data jsonb columns. A ValueComparer is
        // required so EF's change tracking compares contents rather than reference identity,
        // otherwise SaveChangesAsync would never see these columns as modified.
        builder.Property(p => p.TrainingDays)
            .HasColumnType("jsonb")
            .HasConversion(
                value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
                json => JsonSerializer.Deserialize<List<string>>(json, (JsonSerializerOptions?)null) ?? new List<string>())
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (a, b) => (a ?? new List<string>()).SequenceEqual(b ?? new List<string>()),
                a => a.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
                a => a.ToList()));

        builder.Property(p => p.ExtraData)
            .HasColumnType("jsonb")
            .HasConversion(
                value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
                json => JsonSerializer.Deserialize<Dictionary<string, object?>>(json, (JsonSerializerOptions?)null)
                    ?? new Dictionary<string, object?>())
            .Metadata.SetValueComparer(new ValueComparer<Dictionary<string, object?>>(
                (a, b) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(b, (JsonSerializerOptions?)null),
                a => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null).GetHashCode(),
                a => new Dictionary<string, object?>(a)));
    }
}

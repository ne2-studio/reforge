using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Meals.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class MealConfiguration : IEntityTypeConfiguration<Meal>
{
    public void Configure(EntityTypeBuilder<Meal> builder)
    {
        builder.ToTable("Meals");
        builder.HasKey(m => m.Id);

        // Foreign-key-shaped field, not the primary key — unlike UserProfile, a user has many
        // meals. Same text/opaque-OIDC-sub mapping as UserConfiguration/UserProfileConfiguration.
        builder.Property(m => m.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(m => m.MealText).IsRequired();
        builder.Property(m => m.Category).IsRequired();
        builder.Property(m => m.Time).IsRequired();
        builder.Property(m => m.Calories);
        builder.Property(m => m.Protein);
        builder.Property(m => m.Carbs);
        builder.Property(m => m.Fats);
        builder.Property(m => m.Feedback);
        builder.Property(m => m.Timestamp).HasColumnType("timestamp with time zone");
        builder.Property(m => m.Date).HasColumnType("date");
        builder.Property(m => m.CreatedAt).HasColumnType("timestamp with time zone");

        // Same jsonb + ValueComparer technique as UserProfileConfiguration.ExtraData.
        builder.Property(m => m.ExtraData)
            .HasColumnType("jsonb")
            .HasConversion(
                value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
                json => JsonSerializer.Deserialize<Dictionary<string, object?>>(json, (JsonSerializerOptions?)null)
                    ?? new Dictionary<string, object?>())
            .Metadata.SetValueComparer(new ValueComparer<Dictionary<string, object?>>(
                (a, b) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(b, (JsonSerializerOptions?)null),
                a => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null).GetHashCode(),
                a => new Dictionary<string, object?>(a)));

        // Backs GetByUserIdAsync (timestamp desc) and GetByUserIdAndDateAsync — mirrors the
        // source schema's meals_user_id_date_idx.
        builder.HasIndex(m => new { m.UserId, m.Date });
    }
}

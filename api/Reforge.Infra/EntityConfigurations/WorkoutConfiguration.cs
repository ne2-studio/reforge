using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Workouts.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class WorkoutConfiguration : IEntityTypeConfiguration<Workout>
{
    public void Configure(EntityTypeBuilder<Workout> builder)
    {
        builder.ToTable("Workouts");
        builder.HasKey(w => w.Id);

        // Foreign-key-shaped field, not the primary key — a user has many workouts. Same
        // text/opaque-OIDC-sub mapping as MealConfiguration/MealLibraryItemConfiguration.
        builder.Property(w => w.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(w => w.Type).IsRequired();
        builder.Property(w => w.Volume);
        builder.Property(w => w.Duration);
        builder.Property(w => w.Timestamp);

        // Backs GetByUserIdAsync's ordering.
        builder.HasIndex(w => w.UserId);
    }
}

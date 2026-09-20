using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Measurements.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class MeasurementConfiguration : IEntityTypeConfiguration<Measurement>
{
    public void Configure(EntityTypeBuilder<Measurement> builder)
    {
        builder.ToTable("Measurements");
        builder.HasKey(m => m.Id);

        // Foreign-key-shaped field, not the primary key — a user has many measurements. Same
        // text/opaque-OIDC-sub mapping as ActivityConfiguration/WorkoutConfiguration.
        builder.Property(m => m.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(m => m.Weight);
        builder.Property(m => m.Waist);
        builder.Property(m => m.Neck);
        builder.Property(m => m.Timestamp);

        // Backs GetByUserIdAsync's ordering.
        builder.HasIndex(m => m.UserId);
    }
}

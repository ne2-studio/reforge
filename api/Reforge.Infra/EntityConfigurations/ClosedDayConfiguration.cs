using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.ClosedDays.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class ClosedDayConfiguration : IEntityTypeConfiguration<ClosedDay>
{
    public void Configure(EntityTypeBuilder<ClosedDay> builder)
    {
        builder.ToTable("ClosedDays");
        builder.HasKey(d => d.Id);

        // Foreign-key-shaped field, not the primary key — a user has many closed days. Same
        // text/opaque-OIDC-sub mapping as MeasurementConfiguration/WorkoutConfiguration.
        builder.Property(d => d.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(d => d.Date).HasColumnType("date");
        builder.Property(d => d.ClosedAt).HasColumnType("timestamp with time zone");
        builder.Property(d => d.TotalCalories);
        builder.Property(d => d.MealsCount);
        builder.Property(d => d.IsTrainingDay);
        builder.Property(d => d.Analysis);

        // A user can only close a given date once — enforced here as well as in
        // ClosedDaysManager, defense in depth.
        builder.HasIndex(d => new { d.UserId, d.Date }).IsUnique();
    }
}

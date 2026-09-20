using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Activities.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class ActivityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> builder)
    {
        builder.ToTable("Activities");
        builder.HasKey(a => a.Id);

        // Foreign-key-shaped field, not the primary key — a user has many activities. Same
        // text/opaque-OIDC-sub mapping as MealConfiguration/MealLibraryItemConfiguration.
        builder.Property(a => a.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(a => a.Type).IsRequired();
        builder.Property(a => a.Duration);
        builder.Property(a => a.Steps);
        builder.Property(a => a.Timestamp);

        // Backs GetByUserIdAsync's ordering.
        builder.HasIndex(a => a.UserId);
    }
}

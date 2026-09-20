using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.MealLibrary.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class MealLibraryItemConfiguration : IEntityTypeConfiguration<MealLibraryItem>
{
    public void Configure(EntityTypeBuilder<MealLibraryItem> builder)
    {
        builder.ToTable("MealLibraryItems");
        builder.HasKey(m => m.Id);

        // Foreign-key-shaped field, not the primary key — a user has many library items. Same
        // text/opaque-OIDC-sub mapping as MealConfiguration/UserProfileConfiguration.
        builder.Property(m => m.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(m => m.Title).IsRequired();
        builder.Property(m => m.Description).IsRequired();
        builder.Property(m => m.Category).IsRequired();
        builder.Property(m => m.Calories);
        builder.Property(m => m.Protein);
        builder.Property(m => m.Carbs);
        builder.Property(m => m.Fats);

        // Backs GetByUserIdAsync.
        builder.HasIndex(m => m.UserId);
    }
}

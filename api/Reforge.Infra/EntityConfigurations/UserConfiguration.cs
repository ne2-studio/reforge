using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Users.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);

        // OIDC subject ids aren't guaranteed GUID-shaped — see UserId's own doc comment —
        // so the primary key is an opaque text column, not a uuid.
        builder.Property(u => u.Id)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(u => u.CreatedAt).HasColumnType("timestamp with time zone");
        builder.Property(u => u.LastAccessAt).HasColumnType("timestamp with time zone");
    }
}

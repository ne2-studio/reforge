using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class CheckoutSessionConfiguration : IEntityTypeConfiguration<CheckoutSession>
{
    public void Configure(EntityTypeBuilder<CheckoutSession> builder)
    {
        builder.ToTable("CheckoutSessions");
        builder.HasKey(s => s.Id);

        // Foreign-key-shaped field, not the primary key — a user can have many checkout sessions
        // over time (one per checkout attempt). Same text/opaque-OIDC-sub mapping as
        // ChatMessageConfiguration.
        builder.Property(s => s.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(s => s.Status).IsRequired().HasMaxLength(50);
        builder.Property(s => s.CreatedAt).HasColumnType("timestamp with time zone");

        builder.HasIndex(s => s.UserId);
    }
}

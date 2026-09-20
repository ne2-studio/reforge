using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reforge.Domain;
using Reforge.Core.Chat.Domain;

namespace Reforge.Infra.EntityConfigurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");
        builder.HasKey(m => m.Id);

        // Foreign-key-shaped field, not the primary key — a user has many chat messages. Same
        // text/opaque-OIDC-sub mapping as MeasurementConfiguration/MealConfiguration.
        builder.Property(m => m.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .HasColumnType("text")
            .HasMaxLength(255);

        builder.Property(m => m.UserMessage);
        builder.Property(m => m.AssistantMessage);
        builder.Property(m => m.Timestamp).HasColumnType("timestamp with time zone");

        builder.HasIndex(m => new { m.UserId, m.Timestamp });
    }
}

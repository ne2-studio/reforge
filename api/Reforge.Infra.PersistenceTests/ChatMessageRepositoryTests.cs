using FluentAssertions;
using Reforge.Core.Chat.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Slice 8 (docs/plan/02-vertical-slices.md): round-trip a real add+get, prove GetByUserIdAsync
/// orders by Timestamp ascending (oldest first — the ordering ChatManager's system-prompt/
/// history construction and GET /chat-history both rely on), and prove the repository is scoped
/// to the correct userId. Same pattern as MeasurementRepositoryTests.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class ChatMessageRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByUserIdAsync_round_trip_a_chat_message()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ChatMessageRepository(dbContext);
        var userId = new UserId("reforge-chat-user-1");
        var message = NewChatMessage(userId, new DateTime(2026, 3, 4, 12, 0, 0, DateTimeKind.Utc));

        await repository.AddAsync(message);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().ContainSingle();
        reloaded[0].Id.Should().Be(message.Id);
        reloaded[0].UserId.Should().Be(userId);
        reloaded[0].UserMessage.Should().Be("¿Cómo voy hoy?");
        reloaded[0].AssistantMessage.Should().Be("¡Vas muy bien!");
        reloaded[0].Timestamp.Should().Be(message.Timestamp);
    }

    [Fact]
    public async Task GetByUserIdAsync_orders_the_callers_own_messages_by_timestamp_ascending()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ChatMessageRepository(dbContext);
        var userId = new UserId("reforge-chat-user-2");
        var otherUserId = new UserId("reforge-chat-user-other");

        var older = NewChatMessage(userId, new DateTime(2026, 3, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewChatMessage(userId, new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc));
        var othersMessage = NewChatMessage(otherUserId, new DateTime(2026, 3, 3, 8, 0, 0, DateTimeKind.Utc));
        await repository.AddAsync(newer);
        await repository.AddAsync(older);
        await repository.AddAsync(othersMessage);

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Select(m => m.Id).Should().Equal(older.Id, newer.Id);
    }

    [Fact]
    public async Task GetByUserIdAsync_is_scoped_to_the_correct_userId_and_never_returns_another_users_messages()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ChatMessageRepository(dbContext);
        var ownerId = new UserId("reforge-chat-user-3");
        var otherId = new UserId("reforge-chat-user-other-2");

        await repository.AddAsync(NewChatMessage(ownerId, new DateTime(2026, 3, 4, 8, 0, 0, DateTimeKind.Utc)));
        await repository.AddAsync(NewChatMessage(otherId, new DateTime(2026, 3, 4, 8, 0, 0, DateTimeKind.Utc)));

        var reloaded = await repository.GetByUserIdAsync(otherId);

        reloaded.Should().ContainSingle();
        reloaded[0].UserId.Should().Be(otherId);
    }

    private static ChatMessage NewChatMessage(UserId userId, DateTime timestamp) => new(
        Guid.NewGuid(),
        userId,
        "¿Cómo voy hoy?",
        "¡Vas muy bien!",
        timestamp);
}

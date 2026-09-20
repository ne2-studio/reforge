using FluentAssertions;
using Reforge.Core.Reminders.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Same pattern as ProfileRepositoryTests: round-trip a real upsert+get, and prove a second
/// upsert for an already-known user fully replaces the previous settings — mirrors
/// UserProfile's own full-replace semantics.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class ReminderSettingsRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task UpsertAsync_and_GetByUserIdAsync_round_trip_reminder_settings()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ReminderSettingsRepository(dbContext);
        var userId = new UserId("reforge-reminder-settings-user-1");
        var updatedAt = DateTime.UtcNow;
        var settings = new ReminderSettings(userId, enabled: true, channel: "push", defaultTime: "08:00", updatedAt: updatedAt);

        await repository.UpsertAsync(settings);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().NotBeNull();
        reloaded!.UserId.Should().Be(userId);
        reloaded.Enabled.Should().BeTrue();
        reloaded.Channel.Should().Be("push");
        reloaded.DefaultTime.Should().Be("08:00");
        reloaded.UpdatedAt.Should().BeCloseTo(updatedAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task UpsertAsync_for_an_already_known_user_fully_replaces_the_previous_settings()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ReminderSettingsRepository(dbContext);
        var userId = new UserId("reforge-reminder-settings-user-2");
        await repository.UpsertAsync(new ReminderSettings(userId, enabled: true, channel: "push", defaultTime: "08:00", updatedAt: DateTime.UtcNow));

        await repository.UpsertAsync(new ReminderSettings(userId, enabled: false, channel: "email", defaultTime: "20:00", updatedAt: DateTime.UtcNow));

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded!.Enabled.Should().BeFalse();
        reloaded.Channel.Should().Be("email");
        reloaded.DefaultTime.Should().Be("20:00");
    }

    [Fact]
    public async Task GetByUserIdAsync_returns_null_for_a_user_with_no_saved_settings()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ReminderSettingsRepository(dbContext);

        var reloaded = await repository.GetByUserIdAsync(new UserId("does-not-exist"));

        reloaded.Should().BeNull();
    }
}

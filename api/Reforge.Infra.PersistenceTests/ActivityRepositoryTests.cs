using FluentAssertions;
using Reforge.Core.Activities.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Same pattern as MealRepositoryTests: round-trip a real add+get, prove GetByUserIdAsync orders
/// by timestamp desc, and prove the repository is scoped to the correct userId — another user's
/// activities are never returned. See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class ActivityRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByUserIdAsync_round_trip_an_activity()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ActivityRepository(dbContext);
        var userId = new UserId("reforge-activities-user-1");
        var timestamp = new DateTime(2026, 3, 4, 13, 0, 0, DateTimeKind.Utc);
        var activity = new Activity(
            Guid.NewGuid(),
            userId,
            "cardio",
            timestamp: timestamp,
            duration: 45);

        await repository.AddAsync(activity);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().ContainSingle();
        var stored = reloaded[0];
        stored.Id.Should().Be(activity.Id);
        stored.UserId.Should().Be(userId);
        stored.Type.Should().Be("cardio");
        stored.Duration.Should().Be(45);
        stored.Steps.Should().BeNull();
        stored.Timestamp.Should().BeCloseTo(timestamp, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetByUserIdAsync_orders_the_callers_own_activities_by_timestamp_descending()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ActivityRepository(dbContext);
        var userId = new UserId("reforge-activities-user-2");
        var otherUserId = new UserId("reforge-activities-user-other");

        var older = NewActivity(userId, new DateTime(2026, 3, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewActivity(userId, new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc));
        var othersActivity = NewActivity(otherUserId, new DateTime(2026, 3, 3, 8, 0, 0, DateTimeKind.Utc));
        await repository.AddAsync(older);
        await repository.AddAsync(newer);
        await repository.AddAsync(othersActivity);

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Select(a => a.Id).Should().Equal(newer.Id, older.Id);
    }

    [Fact]
    public async Task GetByUserIdAsync_is_scoped_to_the_correct_userId_and_never_returns_another_users_activities()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ActivityRepository(dbContext);
        var ownerId = new UserId("reforge-activities-user-3");
        var otherId = new UserId("reforge-activities-user-other-2");

        await repository.AddAsync(NewActivity(ownerId, DateTime.UtcNow));
        await repository.AddAsync(NewActivity(otherId, DateTime.UtcNow));

        var reloaded = await repository.GetByUserIdAsync(otherId);

        reloaded.Should().ContainSingle();
        reloaded[0].UserId.Should().Be(otherId);
    }

    private static Activity NewActivity(UserId userId, DateTime timestamp) => new(
        Guid.NewGuid(),
        userId,
        "cardio",
        timestamp: timestamp,
        duration: 30);
}

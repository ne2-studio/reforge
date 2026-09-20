using FluentAssertions;
using Reforge.Core.Workouts.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Same pattern as MealRepositoryTests/ActivityRepositoryTests: round-trip a real add+get, prove
/// GetByUserIdAsync orders by timestamp desc, and prove the repository is scoped to the correct
/// userId — another user's workouts are never returned. See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class WorkoutRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByUserIdAsync_round_trip_a_workout()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new WorkoutRepository(dbContext);
        var userId = new UserId("reforge-workouts-user-1");
        var timestamp = new DateTime(2026, 3, 4, 13, 0, 0, DateTimeKind.Utc);
        var workout = new Workout(
            Guid.NewGuid(),
            userId,
            "strength",
            timestamp: timestamp,
            volume: 1250.5);

        await repository.AddAsync(workout);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().ContainSingle();
        var stored = reloaded[0];
        stored.Id.Should().Be(workout.Id);
        stored.UserId.Should().Be(userId);
        stored.Type.Should().Be("strength");
        stored.Volume.Should().Be(1250.5);
        stored.Duration.Should().BeNull();
        stored.Timestamp.Should().BeCloseTo(timestamp, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetByUserIdAsync_orders_the_callers_own_workouts_by_timestamp_descending()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new WorkoutRepository(dbContext);
        var userId = new UserId("reforge-workouts-user-2");
        var otherUserId = new UserId("reforge-workouts-user-other");

        var older = NewWorkout(userId, new DateTime(2026, 3, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewWorkout(userId, new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc));
        var othersWorkout = NewWorkout(otherUserId, new DateTime(2026, 3, 3, 8, 0, 0, DateTimeKind.Utc));
        await repository.AddAsync(older);
        await repository.AddAsync(newer);
        await repository.AddAsync(othersWorkout);

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Select(w => w.Id).Should().Equal(newer.Id, older.Id);
    }

    [Fact]
    public async Task GetByUserIdAsync_is_scoped_to_the_correct_userId_and_never_returns_another_users_workouts()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new WorkoutRepository(dbContext);
        var ownerId = new UserId("reforge-workouts-user-3");
        var otherId = new UserId("reforge-workouts-user-other-2");

        await repository.AddAsync(NewWorkout(ownerId, DateTime.UtcNow));
        await repository.AddAsync(NewWorkout(otherId, DateTime.UtcNow));

        var reloaded = await repository.GetByUserIdAsync(otherId);

        reloaded.Should().ContainSingle();
        reloaded[0].UserId.Should().Be(otherId);
    }

    private static Workout NewWorkout(UserId userId, DateTime timestamp) => new(
        Guid.NewGuid(),
        userId,
        "cardio",
        timestamp: timestamp,
        duration: 30);
}

using Reforge.Domain;
using Reforge.Core.Tests.Fakes;
using Reforge.Core.Workouts;
using Reforge.Core.Workouts.Application;
using Reforge.Core.Workouts.Domain;

namespace Reforge.Core.Tests.Workouts;

public class WorkoutsManagerTests
{
    private static readonly UserId UserId = new("auth0|workouts-user");
    private static readonly UserId OtherUserId = new("auth0|someone-else");

    [Fact]
    public async Task GetWorkoutsAsync_ReturnsTheCallersOwnWorkouts_MostRecentFirst()
    {
        var repository = new FakeWorkoutRepository();
        var theirs = NewWorkout(userId: OtherUserId, timestamp: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));
        var older = NewWorkout(timestamp: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewWorkout(timestamp: new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc));
        repository.Seed(theirs);
        repository.Seed(older);
        repository.Seed(newer);

        var manager = new WorkoutsManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetWorkoutsAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal(newer.Id, result.Value[0].Id);
        Assert.Equal(older.Id, result.Value[1].Id);
    }

    [Fact]
    public async Task LogWorkoutAsync_SavesUnderTheCallersUserId_WithAServerSetTimestamp_AndReturnsTheSavedWorkout()
    {
        var repository = new FakeWorkoutRepository();
        var now = new DateTime(2026, 3, 4, 12, 30, 0, DateTimeKind.Utc);
        var id = Guid.NewGuid();

        var manager = new WorkoutsManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeClock(now),
            new FakeIdGenerator(id));

        var request = new LogWorkoutRequestDto(
            Type: "strength",
            Volume: 1200.5,
            Duration: null);

        var result = await manager.LogWorkoutAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(id, result.Value.Id);
        Assert.Equal("strength", result.Value.Type);
        Assert.Equal(1200.5, result.Value.Volume);
        Assert.Null(result.Value.Duration);
        Assert.Equal(now, result.Value.Timestamp);

        var stored = await repository.GetByUserIdAsync(UserId);
        Assert.Single(stored);
        Assert.Equal(UserId, stored[0].UserId);
    }

    private static Workout NewWorkout(
        UserId? userId = null,
        DateTime? timestamp = null,
        string type = "cardio",
        double? volume = null,
        int? duration = 30) => new(
            Guid.NewGuid(),
            userId ?? UserId,
            type,
            timestamp: timestamp ?? DateTime.UtcNow,
            volume: volume,
            duration: duration);
}

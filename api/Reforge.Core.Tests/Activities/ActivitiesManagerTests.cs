using Reforge.Domain;
using Reforge.Core.Activities;
using Reforge.Core.Activities.Application;
using Reforge.Core.Activities.Domain;
using Reforge.Core.Tests.Fakes;

namespace Reforge.Core.Tests.Activities;

public class ActivitiesManagerTests
{
    private static readonly UserId UserId = new("auth0|activities-user");
    private static readonly UserId OtherUserId = new("auth0|someone-else");

    [Fact]
    public async Task GetActivitiesAsync_ReturnsTheCallersOwnActivities_MostRecentFirst()
    {
        var repository = new FakeActivityRepository();
        var theirs = NewActivity(userId: OtherUserId, timestamp: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));
        var older = NewActivity(timestamp: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewActivity(timestamp: new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc));
        repository.Seed(theirs);
        repository.Seed(older);
        repository.Seed(newer);

        var manager = new ActivitiesManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetActivitiesAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal(newer.Id, result.Value[0].Id);
        Assert.Equal(older.Id, result.Value[1].Id);
    }

    [Fact]
    public async Task LogActivityAsync_SavesUnderTheCallersUserId_WithAServerSetTimestamp_AndReturnsTheSavedActivity()
    {
        var repository = new FakeActivityRepository();
        var now = new DateTime(2026, 3, 4, 12, 30, 0, DateTimeKind.Utc);
        var id = Guid.NewGuid();

        var manager = new ActivitiesManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeClock(now),
            new FakeIdGenerator(id));

        var request = new LogActivityRequestDto(
            Type: "neat",
            Duration: null,
            Steps: 8000);

        var result = await manager.LogActivityAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(id, result.Value.Id);
        Assert.Equal("neat", result.Value.Type);
        Assert.Equal(8000, result.Value.Steps);
        Assert.Null(result.Value.Duration);
        Assert.Equal(now, result.Value.Timestamp);

        var stored = await repository.GetByUserIdAsync(UserId);
        Assert.Single(stored);
        Assert.Equal(UserId, stored[0].UserId);
    }

    private static Activity NewActivity(
        UserId? userId = null,
        DateTime? timestamp = null,
        string type = "cardio",
        int? duration = 30,
        int? steps = null) => new(
            Guid.NewGuid(),
            userId ?? UserId,
            type,
            timestamp: timestamp ?? DateTime.UtcNow,
            duration: duration,
            steps: steps);
}

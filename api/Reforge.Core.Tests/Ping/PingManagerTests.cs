using Reforge.Domain;
using Reforge.Core.Ping.Application;
using Reforge.Core.Shared;
using Reforge.Core.Tests.Fakes;
using Reforge.Core.Users.Domain;

namespace Reforge.Core.Tests.Ping;

public class PingManagerTests
{
    [Fact]
    public async Task PingAsync_ReturnsSyncedUsersSubAndServerTime()
    {
        var userId = new UserId("auth0|abc123");
        var now = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);

        var userRepository = new FakeUserRepository();
        userRepository.Seed(new User(userId, now.AddDays(-1)));

        var manager = new PingManager(
            new FakeCurrentUserProvider(userId),
            userRepository,
            new FakeClock(now));

        var result = await manager.PingAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(userId.Value, result.Value.Sub);
        Assert.Equal(now, result.Value.ServerTimeUtc);
    }

    [Fact]
    public async Task PingAsync_WhenUserNotSynced_ReturnsNotFound()
    {
        var userId = new UserId("auth0|never-synced");

        var manager = new PingManager(
            new FakeCurrentUserProvider(userId),
            new FakeUserRepository(),
            new FakeClock(DateTime.UtcNow));

        var result = await manager.PingAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
    }
}

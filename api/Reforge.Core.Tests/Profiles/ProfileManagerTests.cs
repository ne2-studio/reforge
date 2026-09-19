using Reforge.Domain;
using Reforge.Core.Profiles;
using Reforge.Core.Profiles.Application;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Tests.Fakes;

namespace Reforge.Core.Tests.Profiles;

public class ProfileManagerTests
{
    [Fact]
    public async Task GetProfileAsync_WhenNoProfileSaved_ReturnsNotFound()
    {
        var manager = new ProfileManager(
            new FakeCurrentUserProvider(new UserId("auth0|no-profile-yet")),
            new FakeProfileRepository(),
            new FakeClock(DateTime.UtcNow));

        var result = await manager.GetProfileAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
    }

    [Fact]
    public async Task GetProfileAsync_WhenProfileSaved_ReturnsIt()
    {
        var userId = new UserId("auth0|abc123");
        var updatedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var repository = new FakeProfileRepository();
        repository.Seed(new UserProfile(
            userId,
            updatedAt,
            age: 30,
            gender: "female",
            height: 165,
            weight: 60,
            activityLevel: "moderate",
            goal: "recomposition",
            trainingDays: ["monday", "thursday"],
            trainingType: "strength",
            trainingTime: "morning",
            restrictions: "vegetarian",
            calorieTarget: 2100,
            extraData: new Dictionary<string, object?> { ["favoriteColor"] = "blue" }));

        var manager = new ProfileManager(
            new FakeCurrentUserProvider(userId),
            repository,
            new FakeClock(DateTime.UtcNow));

        var result = await manager.GetProfileAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(30, result.Value.Age);
        Assert.Equal("female", result.Value.Gender);
        Assert.Equal(new List<string> { "monday", "thursday" }, result.Value.TrainingDays);
        Assert.Equal(2100, result.Value.CalorieTarget);
        Assert.Equal("blue", result.Value.ExtraData["favoriteColor"]);
        Assert.Equal(updatedAt, result.Value.UpdatedAt);
    }

    [Fact]
    public async Task SaveProfileAsync_UpsertsUnderTheCallersUserId_AndReturnsTheSavedProfile()
    {
        var userId = new UserId("auth0|abc123");
        var now = new DateTime(2026, 2, 2, 8, 0, 0, DateTimeKind.Utc);
        var repository = new FakeProfileRepository();

        var manager = new ProfileManager(
            new FakeCurrentUserProvider(userId),
            repository,
            new FakeClock(now));

        var request = new SaveProfileRequestDto(
            Age: 28,
            Gender: "male",
            Height: 180,
            Weight: 78,
            ActivityLevel: "high",
            Goal: "muscle-gain",
            TrainingDays: ["tuesday", "friday"],
            TrainingType: "hypertrophy",
            TrainingTime: "evening",
            Restrictions: null,
            CalorieTarget: 2800,
            ExtraData: new Dictionary<string, object?> { ["preferredUnits"] = "metric" });

        var result = await manager.SaveProfileAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(28, result.Value.Age);
        Assert.Equal(now, result.Value.UpdatedAt);

        var stored = await repository.GetByUserIdAsync(userId);
        Assert.NotNull(stored);
        Assert.Equal(userId, stored!.UserId);
        Assert.Equal("muscle-gain", stored.Goal);
    }

    [Fact]
    public async Task SaveProfileAsync_WhenAProfileAlreadyExists_FullyReplacesIt()
    {
        var userId = new UserId("auth0|abc123");
        var repository = new FakeProfileRepository();
        repository.Seed(new UserProfile(
            userId,
            DateTime.UtcNow.AddDays(-1),
            age: 30,
            restrictions: "vegan",
            calorieTarget: 1900));

        var manager = new ProfileManager(
            new FakeCurrentUserProvider(userId),
            repository,
            new FakeClock(DateTime.UtcNow));

        // The new request omits restrictions/calorieTarget entirely — a real replace, not a
        // partial merge with the previously saved values.
        var result = await manager.SaveProfileAsync(new SaveProfileRequestDto(
            Age: 31, Gender: null, Height: null, Weight: null, ActivityLevel: null, Goal: null,
            TrainingDays: null, TrainingType: null, TrainingTime: null, Restrictions: null,
            CalorieTarget: null, ExtraData: null));

        Assert.True(result.IsSuccess);
        Assert.Equal(31, result.Value.Age);
        Assert.Null(result.Value.Restrictions);
        Assert.Null(result.Value.CalorieTarget);
        Assert.Empty(result.Value.TrainingDays);
        Assert.Empty(result.Value.ExtraData);
    }
}

using FluentAssertions;
using Reforge.Core.Profiles.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// The riskiest part of this repository is the TrainingDays/ExtraData jsonb columns
/// (UserProfileConfiguration serializes/deserializes them via System.Text.Json with a hand-
/// written ValueComparer) — neither has real translation semantics against
/// Reforge.Infra.Lite's InMemoryProfileRepository (a plain dictionary), so a regression there
/// would pass unnoticed against the in-memory fake. See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class ProfileRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task UpsertAsync_and_GetByUserIdAsync_round_trip_a_profile_including_its_json_columns()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ProfileRepository(dbContext);
        var userId = new UserId("reforge-profile-user-1");
        var updatedAt = DateTime.UtcNow;
        var profile = new UserProfile(
            userId,
            updatedAt,
            age: 30,
            gender: "female",
            height: 165.5,
            weight: 60.2,
            activityLevel: "moderate",
            goal: "recomposition",
            trainingDays: ["monday", "thursday", "saturday"],
            trainingType: "strength",
            trainingTime: "morning",
            restrictions: "vegetarian",
            calorieTarget: 2100,
            extraData: new Dictionary<string, object?> { ["favoriteColor"] = "blue", ["heightUnit"] = "cm" });

        await repository.UpsertAsync(profile);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().NotBeNull();
        reloaded!.UserId.Should().Be(userId);
        reloaded.Age.Should().Be(30);
        reloaded.Gender.Should().Be("female");
        reloaded.Height.Should().Be(165.5);
        reloaded.Weight.Should().Be(60.2);
        reloaded.ActivityLevel.Should().Be("moderate");
        reloaded.Goal.Should().Be("recomposition");
        reloaded.TrainingDays.Should().Equal("monday", "thursday", "saturday");
        reloaded.TrainingType.Should().Be("strength");
        reloaded.TrainingTime.Should().Be("morning");
        reloaded.Restrictions.Should().Be("vegetarian");
        reloaded.CalorieTarget.Should().Be(2100);
        reloaded.ExtraData.Should().ContainKey("favoriteColor");
        reloaded.ExtraData["favoriteColor"]!.ToString().Should().Be("blue");
        reloaded.UpdatedAt.Should().BeCloseTo(updatedAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task UpsertAsync_for_an_already_known_user_fully_replaces_the_previous_profile()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ProfileRepository(dbContext);
        var userId = new UserId("reforge-profile-user-2");
        await repository.UpsertAsync(new UserProfile(
            userId,
            DateTime.UtcNow,
            age: 30,
            trainingDays: ["monday"],
            restrictions: "vegan",
            calorieTarget: 1900,
            extraData: new Dictionary<string, object?> { ["old"] = true }));

        // A second save without restrictions/extraData at all must genuinely clear them — this
        // is a full replace, not a merge with whatever was saved before.
        await repository.UpsertAsync(new UserProfile(
            userId,
            DateTime.UtcNow,
            age: 31,
            trainingDays: ["tuesday", "friday"],
            calorieTarget: 2200));

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded!.Age.Should().Be(31);
        reloaded.TrainingDays.Should().Equal("tuesday", "friday");
        reloaded.Restrictions.Should().BeNull();
        reloaded.CalorieTarget.Should().Be(2200);
        reloaded.ExtraData.Should().BeEmpty();
    }

    [Fact]
    public async Task GetByUserIdAsync_returns_null_for_a_user_with_no_saved_profile()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ProfileRepository(dbContext);

        var reloaded = await repository.GetByUserIdAsync(new UserId("does-not-exist"));

        reloaded.Should().BeNull();
    }
}

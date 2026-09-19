using FluentAssertions;
using Reforge.Core.Meals.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// The riskiest part of this repository is the same as ProfileRepositoryTests' — the ExtraData
/// jsonb column (MealConfiguration serializes/deserializes it via System.Text.Json with a hand-
/// written ValueComparer), plus GetByUserIdAsync's ORDER BY timestamp desc and
/// GetByUserIdAndDateAsync's date filter, neither of which has real translation semantics against
/// Reforge.Infra.Lite's InMemoryMealRepository (a plain list). See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class MealRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByUserIdAsync_round_trip_a_meal_including_its_json_column()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MealRepository(dbContext);
        var userId = new UserId("reforge-meals-user-1");
        var timestamp = new DateTime(2026, 3, 4, 13, 0, 0, DateTimeKind.Utc);
        var meal = new Meal(
            Guid.NewGuid(),
            userId,
            "Chicken and rice",
            "lunch",
            "13:00",
            calories: 600,
            protein: 50,
            carbs: 60,
            fats: 15,
            timestamp: timestamp,
            date: DateOnly.FromDateTime(timestamp),
            createdAt: timestamp,
            feedback: "Great choice",
            extraData: new Dictionary<string, object?> { ["source"] = "manual" });

        await repository.AddAsync(meal);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().ContainSingle();
        var stored = reloaded[0];
        stored.Id.Should().Be(meal.Id);
        stored.UserId.Should().Be(userId);
        stored.MealText.Should().Be("Chicken and rice");
        stored.Category.Should().Be("lunch");
        stored.Time.Should().Be("13:00");
        stored.Calories.Should().Be(600);
        stored.Protein.Should().Be(50);
        stored.Carbs.Should().Be(60);
        stored.Fats.Should().Be(15);
        stored.Feedback.Should().Be("Great choice");
        stored.Date.Should().Be(DateOnly.FromDateTime(timestamp));
        stored.Timestamp.Should().BeCloseTo(timestamp, TimeSpan.FromSeconds(1));
        stored.ExtraData.Should().ContainKey("source");
        stored.ExtraData["source"]!.ToString().Should().Be("manual");
    }

    [Fact]
    public async Task GetByUserIdAsync_orders_the_callers_own_meals_by_timestamp_descending()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MealRepository(dbContext);
        var userId = new UserId("reforge-meals-user-2");
        var otherUserId = new UserId("reforge-meals-user-other");

        var older = NewMeal(userId, new DateTime(2026, 3, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewMeal(userId, new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc));
        var othersMeal = NewMeal(otherUserId, new DateTime(2026, 3, 3, 8, 0, 0, DateTimeKind.Utc));
        await repository.AddAsync(older);
        await repository.AddAsync(newer);
        await repository.AddAsync(othersMeal);

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Select(m => m.Id).Should().Equal(newer.Id, older.Id);
    }

    [Fact]
    public async Task GetByUserIdAndDateAsync_returns_only_the_callers_meals_for_that_date()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MealRepository(dbContext);
        var userId = new UserId("reforge-meals-user-3");
        var targetDate = new DateOnly(2026, 3, 4);

        var onDate = NewMeal(userId, new DateTime(2026, 3, 4, 9, 0, 0, DateTimeKind.Utc));
        var otherDate = NewMeal(userId, new DateTime(2026, 3, 5, 9, 0, 0, DateTimeKind.Utc));
        await repository.AddAsync(onDate);
        await repository.AddAsync(otherDate);

        var reloaded = await repository.GetByUserIdAndDateAsync(userId, targetDate);

        reloaded.Select(m => m.Id).Should().Equal(onDate.Id);
    }

    private static Meal NewMeal(UserId userId, DateTime timestamp) => new(
        Guid.NewGuid(),
        userId,
        "Test meal",
        "lunch",
        "13:00",
        calories: 400,
        protein: 30,
        carbs: 40,
        fats: 10,
        timestamp: timestamp,
        date: DateOnly.FromDateTime(timestamp),
        createdAt: timestamp);
}

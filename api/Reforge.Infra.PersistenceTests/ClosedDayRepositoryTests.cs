using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Reforge.Core.ClosedDays.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Same pattern as MeasurementRepositoryTests: round-trip a real add+get, prove
/// GetByUserIdAsync orders by Date desc, prove the repository is scoped to the correct userId,
/// and prove the (UserId, Date) unique index is actually enforced by Postgres (not just the
/// use-case's own guard). See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class ClosedDayRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByUserIdAndDateAsync_round_trip_a_closed_day()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ClosedDayRepository(dbContext);
        var userId = new UserId("reforge-closed-days-user-1");
        var date = new DateOnly(2026, 3, 4);
        var closedDay = NewClosedDay(userId, date);

        await repository.AddAsync(closedDay);
        var reloaded = await repository.GetByUserIdAndDateAsync(userId, date);

        reloaded.Should().NotBeNull();
        reloaded!.Id.Should().Be(closedDay.Id);
        reloaded.UserId.Should().Be(userId);
        reloaded.Date.Should().Be(date);
        reloaded.TotalCalories.Should().Be(1800);
        reloaded.MealsCount.Should().Be(3);
        reloaded.IsTrainingDay.Should().BeTrue();
        reloaded.Analysis.Should().Be("Has registrado 3 comidas con un total de 1800 calorías.");
    }

    [Fact]
    public async Task GetByUserIdAndDateAsync_returns_null_when_no_closed_day_exists_for_that_date()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ClosedDayRepository(dbContext);
        var userId = new UserId("reforge-closed-days-user-2");

        var reloaded = await repository.GetByUserIdAndDateAsync(userId, new DateOnly(2026, 3, 4));

        reloaded.Should().BeNull();
    }

    [Fact]
    public async Task GetByUserIdAsync_orders_the_callers_own_closed_days_by_date_descending()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ClosedDayRepository(dbContext);
        var userId = new UserId("reforge-closed-days-user-3");
        var otherUserId = new UserId("reforge-closed-days-user-other");

        var older = NewClosedDay(userId, new DateOnly(2026, 3, 1));
        var newer = NewClosedDay(userId, new DateOnly(2026, 3, 2));
        var othersDay = NewClosedDay(otherUserId, new DateOnly(2026, 3, 3));
        await repository.AddAsync(older);
        await repository.AddAsync(newer);
        await repository.AddAsync(othersDay);

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Select(d => d.Id).Should().Equal(newer.Id, older.Id);
    }

    [Fact]
    public async Task GetByUserIdAsync_is_scoped_to_the_correct_userId_and_never_returns_another_users_closed_days()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ClosedDayRepository(dbContext);
        var ownerId = new UserId("reforge-closed-days-user-4");
        var otherId = new UserId("reforge-closed-days-user-other-2");

        await repository.AddAsync(NewClosedDay(ownerId, new DateOnly(2026, 3, 4)));
        await repository.AddAsync(NewClosedDay(otherId, new DateOnly(2026, 3, 4)));

        var reloaded = await repository.GetByUserIdAsync(otherId);

        reloaded.Should().ContainSingle();
        reloaded[0].UserId.Should().Be(otherId);
    }

    [Fact]
    public async Task AddAsync_throws_when_the_same_user_closes_the_same_date_twice()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new ClosedDayRepository(dbContext);
        var userId = new UserId("reforge-closed-days-user-5");
        var date = new DateOnly(2026, 3, 4);
        await repository.AddAsync(NewClosedDay(userId, date));

        var act = () => repository.AddAsync(NewClosedDay(userId, date));

        await act.Should().ThrowAsync<DbUpdateException>();
    }

    private static ClosedDay NewClosedDay(UserId userId, DateOnly date) => new(
        Guid.NewGuid(),
        userId,
        date,
        closedAt: date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
        totalCalories: 1800,
        mealsCount: 3,
        isTrainingDay: true,
        analysis: "Has registrado 3 comidas con un total de 1800 calorías.");
}

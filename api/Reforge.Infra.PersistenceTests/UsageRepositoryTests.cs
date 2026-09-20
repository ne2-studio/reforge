using FluentAssertions;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Proves IncrementAsync's upsert-increment semantics against a real Postgres: creates the row at
/// count 1 the first time, increments an existing row otherwise, and keeps different
/// (action, month) buckets independent for the same user — the exact behavior
/// SubscriptionsManager's usage-limit check/9th-vs-10th-call boundary depends on.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class UsageRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    private static readonly DateOnly March2026 = new(2026, 3, 1);

    [Fact]
    public async Task GetCountAsync_returns_zero_when_no_usage_has_been_recorded_yet()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new UsageRepository(dbContext);

        var count = await repository.GetCountAsync(new UserId("reforge-usage-user-1"), UsageAction.MealAnalysis, March2026);

        count.Should().Be(0);
    }

    [Fact]
    public async Task IncrementAsync_creates_the_record_at_one_the_first_time_then_increments_it()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new UsageRepository(dbContext);
        var userId = new UserId("reforge-usage-user-2");

        await repository.IncrementAsync(userId, UsageAction.MealAnalysis, March2026);
        (await repository.GetCountAsync(userId, UsageAction.MealAnalysis, March2026)).Should().Be(1);

        await repository.IncrementAsync(userId, UsageAction.MealAnalysis, March2026);
        (await repository.GetCountAsync(userId, UsageAction.MealAnalysis, March2026)).Should().Be(2);
    }

    [Fact]
    public async Task IncrementAsync_keeps_different_actions_and_months_independent_for_the_same_user()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new UsageRepository(dbContext);
        var userId = new UserId("reforge-usage-user-3");
        var april2026 = new DateOnly(2026, 4, 1);

        await repository.IncrementAsync(userId, UsageAction.MealAnalysis, March2026);
        await repository.IncrementAsync(userId, UsageAction.ChatMessage, March2026);
        await repository.IncrementAsync(userId, UsageAction.MealAnalysis, april2026);

        (await repository.GetCountAsync(userId, UsageAction.MealAnalysis, March2026)).Should().Be(1);
        (await repository.GetCountAsync(userId, UsageAction.ChatMessage, March2026)).Should().Be(1);
        (await repository.GetCountAsync(userId, UsageAction.MealAnalysis, april2026)).Should().Be(1);
    }
}

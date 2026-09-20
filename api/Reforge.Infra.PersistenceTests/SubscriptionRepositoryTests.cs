using FluentAssertions;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Same pattern as ReminderSettingsRepositoryTests: round-trip a real upsert+get, and prove a
/// second upsert for an already-known user fully replaces the previous subscription — mirrors
/// Subscription's own full-replace semantics (see SubscriptionsManager.ConfirmCheckoutAsync/
/// CancelAsync).
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class SubscriptionRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task UpsertAsync_and_GetByUserIdAsync_round_trip_a_subscription()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new SubscriptionRepository(dbContext);
        var userId = new UserId("reforge-subscription-user-1");
        var periodEnd = DateTime.UtcNow.AddDays(30);
        var subscription = new Subscription(userId, SubscriptionTiers.Premium, SubscriptionStatuses.Active, periodEnd, DateTime.UtcNow);

        await repository.UpsertAsync(subscription);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().NotBeNull();
        reloaded!.UserId.Should().Be(userId);
        reloaded.Tier.Should().Be(SubscriptionTiers.Premium);
        reloaded.Status.Should().Be(SubscriptionStatuses.Active);
        reloaded.CurrentPeriodEnd.Should().BeCloseTo(periodEnd, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task UpsertAsync_for_an_already_known_user_fully_replaces_the_previous_subscription()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new SubscriptionRepository(dbContext);
        var userId = new UserId("reforge-subscription-user-2");
        await repository.UpsertAsync(new Subscription(
            userId, SubscriptionTiers.Premium, SubscriptionStatuses.Active, DateTime.UtcNow.AddDays(30), DateTime.UtcNow));

        await repository.UpsertAsync(new Subscription(
            userId, SubscriptionTiers.Free, SubscriptionStatuses.Canceled, currentPeriodEnd: null, updatedAt: DateTime.UtcNow));

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded!.Tier.Should().Be(SubscriptionTiers.Free);
        reloaded.Status.Should().Be(SubscriptionStatuses.Canceled);
        reloaded.CurrentPeriodEnd.Should().BeNull();
    }

    [Fact]
    public async Task GetByUserIdAsync_returns_null_for_a_user_who_has_never_subscribed()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new SubscriptionRepository(dbContext);

        var reloaded = await repository.GetByUserIdAsync(new UserId("does-not-exist"));

        reloaded.Should().BeNull();
    }
}

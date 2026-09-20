using FluentAssertions;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Round-trip a real add+get, and prove UpdateAsync (used by
/// SubscriptionsManager.ConfirmCheckoutAsync to mark a session Completed) both actually persists
/// the change and is scoped to (UserId, Id) — mirrors CustomReminderRepositoryTests' existence
/// semantics.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class CheckoutSessionRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByIdAsync_round_trip_a_checkout_session()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CheckoutSessionRepository(dbContext);
        var userId = new UserId("reforge-checkout-user-1");
        var sessionId = Guid.NewGuid();
        var session = new CheckoutSession(sessionId, userId, CheckoutSessionStatuses.Pending, DateTime.UtcNow);

        await repository.AddAsync(session);
        var reloaded = await repository.GetByIdAsync(sessionId);

        reloaded.Should().NotBeNull();
        reloaded!.UserId.Should().Be(userId);
        reloaded.Status.Should().Be(CheckoutSessionStatuses.Pending);
    }

    [Fact]
    public async Task UpdateAsync_persists_the_new_status_for_an_existing_session()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CheckoutSessionRepository(dbContext);
        var userId = new UserId("reforge-checkout-user-2");
        var sessionId = Guid.NewGuid();
        var createdAt = DateTime.UtcNow;
        await repository.AddAsync(new CheckoutSession(sessionId, userId, CheckoutSessionStatuses.Pending, createdAt));

        var updated = await repository.UpdateAsync(new CheckoutSession(sessionId, userId, CheckoutSessionStatuses.Completed, createdAt));

        updated.Should().BeTrue();
        var reloaded = await repository.GetByIdAsync(sessionId);
        reloaded!.Status.Should().Be(CheckoutSessionStatuses.Completed);
    }

    [Fact]
    public async Task UpdateAsync_returns_false_for_a_session_that_does_not_belong_to_that_user()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CheckoutSessionRepository(dbContext);
        var owner = new UserId("reforge-checkout-user-3");
        var someoneElse = new UserId("reforge-checkout-user-other");
        var sessionId = Guid.NewGuid();
        await repository.AddAsync(new CheckoutSession(sessionId, owner, CheckoutSessionStatuses.Pending, DateTime.UtcNow));

        var updated = await repository.UpdateAsync(new CheckoutSession(sessionId, someoneElse, CheckoutSessionStatuses.Completed, DateTime.UtcNow));

        updated.Should().BeFalse();
    }

    [Fact]
    public async Task GetByIdAsync_returns_null_for_an_unknown_session()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CheckoutSessionRepository(dbContext);

        var reloaded = await repository.GetByIdAsync(Guid.NewGuid());

        reloaded.Should().BeNull();
    }
}

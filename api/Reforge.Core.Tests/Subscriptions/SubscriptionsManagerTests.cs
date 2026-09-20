using Reforge.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Subscriptions;
using Reforge.Core.Subscriptions.Application;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Tests.Fakes;

namespace Reforge.Core.Tests.Subscriptions;

/// <summary>
/// Slice 9 (docs/plan/02-vertical-slices.md): the fully faked Stripe checkout/cancel flow and the
/// Free-tier usage-limit boundary. Fake-first, same pattern as ChatManagerTests/
/// WeeklyProgressManagerTests.
/// </summary>
public class SubscriptionsManagerTests
{
    private static readonly UserId UserId = new("auth0|subscriptions-user");

    private static SubscriptionsManager CreateManager(
        FakeSubscriptionRepository? subscriptionRepository = null,
        FakeCheckoutSessionRepository? checkoutSessionRepository = null,
        FakeUsageRepository? usageRepository = null,
        DateTime? now = null,
        Guid? nextId = null) => new(
            new FakeCurrentUserProvider(UserId),
            subscriptionRepository ?? new FakeSubscriptionRepository(),
            checkoutSessionRepository ?? new FakeCheckoutSessionRepository(),
            usageRepository ?? new FakeUsageRepository(),
            new FakeClock(now ?? new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc)),
            new FakeIdGenerator(nextId ?? Guid.NewGuid()));

    [Fact]
    public async Task StartCheckoutAsync_CreatesAPendingSession_AndReturnsASameOriginCheckoutUrl()
    {
        var checkoutSessionRepository = new FakeCheckoutSessionRepository();
        var sessionId = Guid.NewGuid();
        var manager = CreateManager(checkoutSessionRepository: checkoutSessionRepository, nextId: sessionId);

        var result = await manager.StartCheckoutAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(sessionId, result.Value.SessionId);
        Assert.Equal($"/suscripcion/checkout?session={sessionId}", result.Value.CheckoutUrl);

        var session = await checkoutSessionRepository.GetByIdAsync(sessionId);
        Assert.NotNull(session);
        Assert.Equal(UserId, session!.UserId);
        Assert.Equal(CheckoutSessionStatuses.Pending, session.Status);
    }

    [Fact]
    public async Task ConfirmCheckoutAsync_MarksTheSessionCompleted_AndActivatesPremium()
    {
        var checkoutSessionRepository = new FakeCheckoutSessionRepository();
        var subscriptionRepository = new FakeSubscriptionRepository();
        var sessionId = Guid.NewGuid();
        checkoutSessionRepository.Seed(new CheckoutSession(sessionId, UserId, CheckoutSessionStatuses.Pending, DateTime.UtcNow));
        var now = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);
        var manager = CreateManager(subscriptionRepository: subscriptionRepository, checkoutSessionRepository: checkoutSessionRepository, now: now);

        var result = await manager.ConfirmCheckoutAsync(sessionId);

        Assert.True(result.IsSuccess);
        Assert.Equal(SubscriptionTiers.Premium, result.Value.Tier);
        Assert.Equal(SubscriptionStatuses.Active, result.Value.Status);
        Assert.Equal(now.AddDays(30), result.Value.CurrentPeriodEnd);

        var session = await checkoutSessionRepository.GetByIdAsync(sessionId);
        Assert.Equal(CheckoutSessionStatuses.Completed, session!.Status);
    }

    [Fact]
    public async Task ConfirmCheckoutAsync_WhenTheSessionDoesNotExist_ReturnsNotFound()
    {
        var manager = CreateManager();

        var result = await manager.ConfirmCheckoutAsync(Guid.NewGuid());

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
    }

    [Fact]
    public async Task ConfirmCheckoutAsync_WhenTheSessionBelongsToSomeoneElse_ReturnsNotFound()
    {
        var checkoutSessionRepository = new FakeCheckoutSessionRepository();
        var sessionId = Guid.NewGuid();
        checkoutSessionRepository.Seed(new CheckoutSession(
            sessionId, new UserId("someone-else"), CheckoutSessionStatuses.Pending, DateTime.UtcNow));
        var manager = CreateManager(checkoutSessionRepository: checkoutSessionRepository);

        var result = await manager.ConfirmCheckoutAsync(sessionId);

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
    }

    [Fact]
    public async Task ConfirmCheckoutAsync_WhenTheSessionIsAlreadyCompleted_ReturnsValidationFailure()
    {
        var checkoutSessionRepository = new FakeCheckoutSessionRepository();
        var sessionId = Guid.NewGuid();
        checkoutSessionRepository.Seed(new CheckoutSession(sessionId, UserId, CheckoutSessionStatuses.Completed, DateTime.UtcNow));
        var manager = CreateManager(checkoutSessionRepository: checkoutSessionRepository);

        var result = await manager.ConfirmCheckoutAsync(sessionId);

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Validation, result.Error.Code);
    }

    [Fact]
    public async Task CancelAsync_RevertsAnActivePremiumSubscription_ToFreeAndCanceled()
    {
        var subscriptionRepository = new FakeSubscriptionRepository();
        subscriptionRepository.Seed(new Subscription(
            UserId, SubscriptionTiers.Premium, SubscriptionStatuses.Active,
            currentPeriodEnd: DateTime.UtcNow.AddDays(20), updatedAt: DateTime.UtcNow));
        var manager = CreateManager(subscriptionRepository: subscriptionRepository);

        var result = await manager.CancelAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(SubscriptionTiers.Free, result.Value.Tier);
        Assert.Equal(SubscriptionStatuses.Canceled, result.Value.Status);
        Assert.Null(result.Value.CurrentPeriodEnd);
    }

    [Fact]
    public async Task GetSubscriptionAsync_ForAUserWhoNeverSubscribed_ReturnsFreeNoneWithZeroUsage()
    {
        var manager = CreateManager();

        var result = await manager.GetSubscriptionAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(SubscriptionTiers.Free, result.Value.Tier);
        Assert.Equal(SubscriptionStatuses.None, result.Value.Status);
        Assert.Null(result.Value.CurrentPeriodEnd);
        Assert.Equal(0, result.Value.Usage.MealAnalysis.Count);
        Assert.Equal(10, result.Value.Usage.MealAnalysis.Limit);
        Assert.Equal(0, result.Value.Usage.ChatMessages.Count);
        Assert.Equal(10, result.Value.Usage.ChatMessages.Limit);
    }

    [Fact]
    public async Task GetBillingPortalAsync_ReturnsASameOriginPortalUrl()
    {
        var manager = CreateManager();

        var result = await manager.GetBillingPortalAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal("/suscripcion/portal", result.Value.PortalUrl);
    }

    [Fact]
    public async Task CheckUsageLimitAsync_TheNinthCallInAMonth_Succeeds_AndTheTenthIsForbidden()
    {
        var usageRepository = new FakeUsageRepository();
        var now = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);
        var month = new DateOnly(2026, 3, 1);
        usageRepository.Seed(UserId, UsageAction.MealAnalysis, month, count: 9);
        var manager = CreateManager(usageRepository: usageRepository, now: now);

        var ninthCheck = await manager.CheckUsageLimitAsync(UsageAction.MealAnalysis);
        Assert.True(ninthCheck.IsSuccess);

        await manager.RecordUsageAsync(UsageAction.MealAnalysis);
        Assert.Equal(10, await usageRepository.GetCountAsync(UserId, UsageAction.MealAnalysis, month));

        var tenthCheck = await manager.CheckUsageLimitAsync(UsageAction.MealAnalysis);
        Assert.True(tenthCheck.IsFailure);
        Assert.Equal(ApplicationErrorCode.Forbidden, tenthCheck.Error.Code);
    }

    [Fact]
    public async Task CheckUsageLimitAsync_ForAPremiumUser_NeverBlocks_RegardlessOfUsageCount()
    {
        var subscriptionRepository = new FakeSubscriptionRepository();
        subscriptionRepository.Seed(new Subscription(
            UserId, SubscriptionTiers.Premium, SubscriptionStatuses.Active,
            currentPeriodEnd: DateTime.UtcNow.AddDays(20), updatedAt: DateTime.UtcNow));
        var usageRepository = new FakeUsageRepository();
        usageRepository.Seed(UserId, UsageAction.ChatMessage, new DateOnly(2026, 3, 1), count: 999);
        var manager = CreateManager(subscriptionRepository: subscriptionRepository, usageRepository: usageRepository);

        var result = await manager.CheckUsageLimitAsync(UsageAction.ChatMessage);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task RecordUsageAsync_ForAPremiumUser_DoesNotIncrementUsage()
    {
        var subscriptionRepository = new FakeSubscriptionRepository();
        subscriptionRepository.Seed(new Subscription(
            UserId, SubscriptionTiers.Premium, SubscriptionStatuses.Active,
            currentPeriodEnd: DateTime.UtcNow.AddDays(20), updatedAt: DateTime.UtcNow));
        var usageRepository = new FakeUsageRepository();
        var manager = CreateManager(subscriptionRepository: subscriptionRepository, usageRepository: usageRepository);

        await manager.RecordUsageAsync(UsageAction.ChatMessage);

        Assert.Equal(0, await usageRepository.GetCountAsync(UserId, UsageAction.ChatMessage, new DateOnly(2026, 3, 1)));
    }
}

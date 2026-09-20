using Reforge.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Core.Subscriptions.Application;

public class SubscriptionsManager(
    ICurrentUserProvider currentUserProvider,
    ISubscriptionRepository subscriptionRepository,
    ICheckoutSessionRepository checkoutSessionRepository,
    IUsageRepository usageRepository,
    IClock clock,
    IIdGenerator idGenerator) : ISubscriptionsUseCase
{
    // Free-tier monthly allotment, shared by both limited actions (MealAnalysis/ChatMessage) —
    // see docs/plan/02-vertical-slices.md, Slice 9.
    private const int FreeTierMonthlyLimit = 10;

    // Fully faked Stripe checkout — real Stripe billing periods are monthly; 30 days is a
    // deliberately simple stand-in, not calendar-month math.
    private const int BillingPeriodDays = 30;

    public async Task<Result<CheckoutSessionResponseDto>> StartCheckoutAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var sessionId = idGenerator.NewId();
        var session = new CheckoutSession(sessionId, userId, CheckoutSessionStatuses.Pending, clock.UtcNow());

        await checkoutSessionRepository.AddAsync(session);

        return Result.Success(new CheckoutSessionResponseDto(sessionId, $"/suscripcion/checkout?session={sessionId}"));
    }

    public async Task<Result<SubscriptionSummaryDto>> ConfirmCheckoutAsync(Guid sessionId)
    {
        var userId = currentUserProvider.GetUserId();
        var session = await checkoutSessionRepository.GetByIdAsync(sessionId);

        // A session belonging to someone else is reported as NotFound, not Forbidden — its
        // existence must not be disclosed to this caller (docs/API-CONVENTIONS.md).
        if (session is null || session.UserId != userId)
            return Result.Failure<SubscriptionSummaryDto>(ApplicationError.NotFound("Checkout session not found"));

        if (session.Status != CheckoutSessionStatuses.Pending)
        {
            return Result.Failure<SubscriptionSummaryDto>(
                ApplicationError.Validation("Checkout session is no longer pending"));
        }

        var now = clock.UtcNow();
        await checkoutSessionRepository.UpdateAsync(
            new CheckoutSession(session.Id, session.UserId, CheckoutSessionStatuses.Completed, session.CreatedAt));

        var subscription = new Subscription(
            userId,
            SubscriptionTiers.Premium,
            SubscriptionStatuses.Active,
            currentPeriodEnd: now.AddDays(BillingPeriodDays),
            updatedAt: now);
        await subscriptionRepository.UpsertAsync(subscription);

        return Result.Success(await BuildSummaryAsync(userId, subscription, now));
    }

    public Task<Result<BillingPortalResponseDto>> GetBillingPortalAsync() =>
        Task.FromResult(Result.Success(new BillingPortalResponseDto("/suscripcion/portal")));

    public async Task<Result<SubscriptionSummaryDto>> CancelAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var now = clock.UtcNow();

        var subscription = new Subscription(
            userId, SubscriptionTiers.Free, SubscriptionStatuses.Canceled, currentPeriodEnd: null, updatedAt: now);
        await subscriptionRepository.UpsertAsync(subscription);

        return Result.Success(await BuildSummaryAsync(userId, subscription, now));
    }

    public async Task<Result<SubscriptionSummaryDto>> GetSubscriptionAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var now = clock.UtcNow();
        var subscription = await subscriptionRepository.GetByUserIdAsync(userId) ?? Subscription.CreateDefault(userId, now);

        return Result.Success(await BuildSummaryAsync(userId, subscription, now));
    }

    public async Task<Result> CheckUsageLimitAsync(UsageAction action)
    {
        var userId = currentUserProvider.GetUserId();
        var subscription = await subscriptionRepository.GetByUserIdAsync(userId);
        if (subscription?.Tier == SubscriptionTiers.Premium)
            return Result.Success();

        var count = await usageRepository.GetCountAsync(userId, action, CurrentMonth());
        if (count >= FreeTierMonthlyLimit)
        {
            return Result.Failure(ApplicationError.Forbidden(
                $"Monthly {action} limit reached for the Free tier. Upgrade to Premium for unlimited use."));
        }

        return Result.Success();
    }

    public async Task RecordUsageAsync(UsageAction action)
    {
        var userId = currentUserProvider.GetUserId();
        var subscription = await subscriptionRepository.GetByUserIdAsync(userId);
        if (subscription?.Tier == SubscriptionTiers.Premium)
            return;

        await usageRepository.IncrementAsync(userId, action, CurrentMonth());
    }

    private async Task<SubscriptionSummaryDto> BuildSummaryAsync(
        UserId userId, Subscription subscription, DateTime now)
    {
        var month = new DateOnly(now.Year, now.Month, 1);
        var mealAnalysisUsed = await usageRepository.GetCountAsync(userId, UsageAction.MealAnalysis, month);
        var chatUsed = await usageRepository.GetCountAsync(userId, UsageAction.ChatMessage, month);

        return new SubscriptionSummaryDto(
            subscription.Tier,
            subscription.Status,
            subscription.CurrentPeriodEnd,
            new UsageDto(mealAnalysisUsed, FreeTierMonthlyLimit),
            new UsageDto(chatUsed, FreeTierMonthlyLimit));
    }

    private DateOnly CurrentMonth()
    {
        var now = clock.UtcNow();
        return new DateOnly(now.Year, now.Month, 1);
    }
}

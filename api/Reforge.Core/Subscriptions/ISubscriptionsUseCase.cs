using Reforge.Core.Shared;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Core.Subscriptions;

/// <summary>
/// Slice 9 (docs/plan/02-vertical-slices.md): subscriptions and usage limits. A fully faked Stripe
/// flow — no Stripe SDK, no network calls, no webhook signature verification, everything
/// simulated in-process — plus the Free-tier monthly usage limit (10/month each) for AI meal
/// analysis and coach chat. Gated end-to-end by IFeatureFlags.SubscriptionsEnabled(): when off,
/// SubscriptionsController isn't even registered (see Reforge.Api.Common.ReforgeApiHost), so none
/// of these verbs are reachable over HTTP; MealsManager/ChatManager also skip calling
/// CheckUsageLimitAsync/RecordUsageAsync entirely in that case, rather than relying on these
/// methods being no-ops, so today's unlimited behavior is preserved verbatim while the flag is
/// off. All verbs resolve the caller's identity themselves via ICurrentUserProvider; it is never a
/// parameter here (CheckoutAsync/CancelAsync/GetSubscriptionAsync) except where the caller
/// legitimately supplies something else identifying, like a checkout session id.
/// </summary>
public interface ISubscriptionsUseCase
{
    /// <summary>Creates a pending fake Stripe checkout session for the caller and returns a
    /// same-origin SPA path standing in for Stripe's real checkout URL — the backend never
    /// redirects anywhere, it just builds this string.</summary>
    Task<Result<CheckoutSessionResponseDto>> StartCheckoutAsync();

    /// <summary>Plays the role of Stripe's checkout.session.completed webhook, in-process: marks
    /// the given session Completed and activates the caller's subscription (Premium tier, Active
    /// status, CurrentPeriodEnd 30 days from now). Fails (mapped the same way other business-rule
    /// violations are, via ApplicationError/ErrorMapping) if the session doesn't exist or doesn't
    /// belong to the caller (NotFound — its existence must not be disclosed to anyone else), or if
    /// it's no longer Pending (Validation).</summary>
    Task<Result<SubscriptionSummaryDto>> ConfirmCheckoutAsync(Guid sessionId);

    /// <summary>Returns a same-origin SPA path standing in for Stripe's real billing portal — no
    /// backend-side state change happens here.</summary>
    Task<Result<BillingPortalResponseDto>> GetBillingPortalAsync();

    /// <summary>Plays the role of Stripe's customer.subscription.deleted webhook, in-process:
    /// immediately reverts the caller's subscription to Free tier / Canceled status — no
    /// cancel-at-period-end grace window.</summary>
    Task<Result<SubscriptionSummaryDto>> CancelAsync();

    /// <summary>The caller's current subscription plus this calendar month's usage against the
    /// Free-tier limits — the shape the subscription screen and the AILimitReached/usage-bar UI
    /// render from.</summary>
    Task<Result<SubscriptionSummaryDto>> GetSubscriptionAsync();

    /// <summary>Fails with a Forbidden ApplicationError if the caller is on the Free tier and has
    /// already used up this calendar month's allotment for the given action; succeeds (Premium
    /// tier is always unlimited) otherwise. MealsManager/ChatManager call this before performing
    /// a Free-tier-limited action — but only when IFeatureFlags.SubscriptionsEnabled() is true;
    /// see this interface's own doc comment.</summary>
    Task<Result> CheckUsageLimitAsync(UsageAction action);

    /// <summary>Increments the caller's usage counter for the given action this calendar month.
    /// Call only after the guarded action itself actually succeeded (see
    /// MealsManager.AnalyzeAndSaveMealAsync/ChatManager.SendMessageAsync) — never speculatively
    /// before knowing that. A no-op for Premium-tier callers, who are never limited and so never
    /// need their usage tracked for correctness.</summary>
    Task RecordUsageAsync(UsageAction action);
}

public record CheckoutSessionResponseDto(Guid SessionId, string CheckoutUrl);

public record BillingPortalResponseDto(string PortalUrl);

/// <summary>
/// The caller's subscription state plus this calendar month's usage against the Free-tier limits.
/// This is the one shape both the subscription screen and the AILimitReached/usage-bar UI render
/// from — field names are deliberately explicit and self-describing.
/// </summary>
/// <param name="Tier">"Free" or "Premium" (see SubscriptionTiers).</param>
/// <param name="Status">"None" (never subscribed), "Active" (currently paying, within a
/// billing period) or "Canceled" (was Active, has since reverted to Free) — see
/// SubscriptionStatuses.</param>
/// <param name="CurrentPeriodEnd">UTC end of the current paid billing period. Null unless Status
/// is "Active".</param>
/// <param name="Usage">This calendar month's usage vs. the Free-tier monthly limits, for both
/// limited actions.</param>
public record SubscriptionSummaryDto(
    string Tier,
    string Status,
    DateTime? CurrentPeriodEnd,
    UsageBreakdownDto Usage);

/// <param name="MealAnalysis">This calendar month's AI meal-analysis usage vs. the Free-tier
/// monthly limit.</param>
/// <param name="ChatMessages">This calendar month's coach-chat usage vs. the Free-tier monthly
/// limit.</param>
public record UsageBreakdownDto(UsageDto MealAnalysis, UsageDto ChatMessages);

/// <param name="Count">Calls made so far this calendar month, for this one action.</param>
/// <param name="Limit">The Free-tier monthly allotment for this action (10). Purely informational
/// for a Premium-tier caller — they are never blocked by it.</param>
public record UsageDto(int Count, int Limit);

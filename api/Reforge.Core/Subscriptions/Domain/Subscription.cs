using Reforge.Domain;

namespace Reforge.Core.Subscriptions.Domain;

// Slice 9 (docs/plan/02-vertical-slices.md): a user's subscription state. Keyed by UserId with no
// separate surrogate key — 1:1 with the user, same shape as ReminderSettings — because there is
// exactly one "current subscription" per user, and every change (checkout confirm, cancel) fully
// replaces it rather than appending a new row. A user who has never subscribed has no row at all;
// SubscriptionsManager treats that as equivalent to an explicit Free/Inactive row (see
// Subscription.CreateDefault) so callers never have to special-case null.
public sealed class Subscription
{
    public UserId UserId { get; }
    public string Tier { get; }
    public string Status { get; }
    public DateTime? CurrentPeriodEnd { get; }
    public DateTime UpdatedAt { get; }

    public Subscription(UserId userId, string tier, string status, DateTime? currentPeriodEnd, DateTime updatedAt)
    {
        UserId = userId;
        Tier = tier;
        Status = status;
        CurrentPeriodEnd = currentPeriodEnd;
        UpdatedAt = updatedAt;
    }

    /// <summary>The implicit state of a user who has never checked out — Free tier, Inactive
    /// status, no current period. Never persisted as such; only ever constructed in memory when
    /// ISubscriptionRepository.GetByUserIdAsync returns null.</summary>
    public static Subscription CreateDefault(UserId userId, DateTime now) =>
        new(userId, SubscriptionTiers.Free, SubscriptionStatuses.Inactive, currentPeriodEnd: null, updatedAt: now);
}

public static class SubscriptionTiers
{
    public const string Free = "Free";
    public const string Premium = "Premium";
}

public static class SubscriptionStatuses
{
    public const string Inactive = "Inactive";
    public const string Active = "Active";
    public const string Canceled = "Canceled";
}

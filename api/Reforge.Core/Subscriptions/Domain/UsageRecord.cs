using Reforge.Domain;

namespace Reforge.Core.Subscriptions.Domain;

// Design decision: a separate UsageRecord entity keyed by (UserId, Action, Month), rather than
// counters embedded on Subscription. Usage resets every calendar month and Subscription doesn't
// (it only changes on checkout/cancel), so folding both into one row would mean either resetting
// unrelated subscription fields on a schedule, or growing Subscription with month-keyed
// bookkeeping it has no other reason to know about. A separate table also lets both actions
// (MealAnalysis/ChatMessage) share one shape without Subscription growing a column per action.
// This mirrors the rest of the codebase's "small entity per distinct concern, not one wide row"
// convention (e.g. ReminderSettings vs. CustomReminder).
public sealed class UsageRecord
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public UsageAction Action { get; }

    /// <summary>The first day of the calendar month this count applies to (UTC) — e.g. 2026-03-01
    /// for every use recorded during March 2026. Never any other day of the month.</summary>
    public DateOnly Month { get; }

    public int Count { get; }

    public UsageRecord(Guid id, UserId userId, UsageAction action, DateOnly month, int count)
    {
        Id = id;
        UserId = userId;
        Action = action;
        Month = month;
        Count = count;
    }
}

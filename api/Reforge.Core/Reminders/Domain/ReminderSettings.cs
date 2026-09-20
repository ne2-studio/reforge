using Reforge.Domain;

namespace Reforge.Core.Reminders.Domain;

// Slice 6 (docs/plan/02-vertical-slices.md): a user's global reminder preferences — 1:1 with
// Reforge.Core.Users.Domain.User, same shape as UserProfile (keyed by UserId, no separate
// surrogate key, always fully replaced on save). Fields are a reasonable minimal set for a
// meal/workout tracking app's reminder settings: whether reminders are on at all, which channel
// they're delivered through, and the default time-of-day used for reminders that don't specify
// their own (CustomReminder.Time always wins when set). UpdatedAt is server-set at save time
// (IClock.UtcNow()), mirroring UserProfile.
public sealed class ReminderSettings
{
    public UserId UserId { get; }
    public bool Enabled { get; }
    public string Channel { get; }
    public string DefaultTime { get; }
    public DateTime UpdatedAt { get; }

    public ReminderSettings(
        UserId userId,
        bool enabled,
        string channel,
        string defaultTime,
        DateTime updatedAt)
    {
        UserId = userId;
        Enabled = enabled;
        Channel = channel;
        DefaultTime = defaultTime;
        UpdatedAt = updatedAt;
    }
}

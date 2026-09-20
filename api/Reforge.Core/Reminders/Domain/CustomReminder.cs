using Reforge.Domain;

namespace Reforge.Core.Reminders.Domain;

// Slice 6 (docs/plan/02-vertical-slices.md): a user-defined reminder in addition to
// ReminderSettings' global defaults — e.g. "log your dinner" every Mon/Wed/Fri at 20:00. Id is a
// server-generated surrogate key; UserId is a plain foreign-key-shaped field, a user has many
// custom reminders — same shape as Measurement, except this one supports update (Slice 6's CRUD
// requirement), so UpdatedAt is tracked like UserProfile's.
public sealed class CustomReminder
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public string Label { get; }
    public string Time { get; }
    public List<string> DaysOfWeek { get; }
    public bool Enabled { get; }
    public DateTime UpdatedAt { get; }

    public CustomReminder(
        Guid id,
        UserId userId,
        string label,
        string time,
        List<string> daysOfWeek,
        bool enabled,
        DateTime updatedAt)
    {
        Id = id;
        UserId = userId;
        Label = label;
        Time = time;
        DaysOfWeek = daysOfWeek;
        Enabled = enabled;
        UpdatedAt = updatedAt;
    }
}

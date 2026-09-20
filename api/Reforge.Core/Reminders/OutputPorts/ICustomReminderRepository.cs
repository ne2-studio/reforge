using Reforge.Domain;
using Reforge.Core.Reminders.Domain;

namespace Reforge.Core.Reminders.OutputPorts;

public interface ICustomReminderRepository
{
    /// <summary>The caller's own custom reminders.</summary>
    Task<List<CustomReminder>> GetByUserIdAsync(UserId userId);

    Task AddAsync(CustomReminder reminder);

    /// <summary>Replaces the reminder with the given id, scoped to the given userId — a caller
    /// can never update another user's reminder. Returns true if a reminder was found and
    /// updated, false if no such reminder exists for that user (either it never existed, or it
    /// belongs to someone else).</summary>
    Task<bool> UpdateAsync(CustomReminder reminder);

    /// <summary>Deletes the reminder with the given id, scoped to the given userId — same
    /// existence semantics as UpdateAsync.</summary>
    Task<bool> DeleteAsync(UserId userId, Guid id);
}

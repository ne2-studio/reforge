using Reforge.Domain;
using Reforge.Core.Reminders.Domain;

namespace Reforge.Core.Reminders.OutputPorts;

public interface IReminderSettingsRepository
{
    Task<ReminderSettings?> GetByUserIdAsync(UserId userId);

    /// <summary>Inserts the settings if none exist yet for this user, or fully replaces the
    /// existing ones otherwise — mirrors IProfileRepository.UpsertAsync.</summary>
    Task UpsertAsync(ReminderSettings settings);
}

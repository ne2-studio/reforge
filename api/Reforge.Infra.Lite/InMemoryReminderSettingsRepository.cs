using Reforge.Domain;
using Reforge.Core.Reminders.Domain;
using Reforge.Core.Reminders.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryProfileRepository.
public class InMemoryReminderSettingsRepository : IReminderSettingsRepository
{
    private readonly Dictionary<UserId, ReminderSettings> _settings = new();
    private readonly Lock _lock = new();

    public Task<ReminderSettings?> GetByUserIdAsync(UserId userId)
    {
        lock (_lock) return Task.FromResult(_settings.GetValueOrDefault(userId));
    }

    public Task UpsertAsync(ReminderSettings settings)
    {
        lock (_lock) _settings[settings.UserId] = settings;
        return Task.CompletedTask;
    }
}

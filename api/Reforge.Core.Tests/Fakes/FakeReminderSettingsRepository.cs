using Reforge.Domain;
using Reforge.Core.Reminders.Domain;
using Reforge.Core.Reminders.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeReminderSettingsRepository : IReminderSettingsRepository
{
    private readonly Dictionary<UserId, ReminderSettings> _settings = new();

    public Task<ReminderSettings?> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_settings.GetValueOrDefault(userId));

    public Task UpsertAsync(ReminderSettings settings)
    {
        _settings[settings.UserId] = settings;
        return Task.CompletedTask;
    }

    public void Seed(ReminderSettings settings) => _settings[settings.UserId] = settings;
}

using Reforge.Domain;
using Reforge.Core.Reminders.Domain;
using Reforge.Core.Reminders.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryMealLibraryRepository.
public class InMemoryCustomReminderRepository : ICustomReminderRepository
{
    private readonly List<CustomReminder> _reminders = [];
    private readonly Lock _lock = new();

    public Task<List<CustomReminder>> GetByUserIdAsync(UserId userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_reminders
                .Where(r => r.UserId == userId)
                .ToList());
        }
    }

    public Task AddAsync(CustomReminder reminder)
    {
        lock (_lock) _reminders.Add(reminder);
        return Task.CompletedTask;
    }

    public Task<bool> UpdateAsync(CustomReminder reminder)
    {
        lock (_lock)
        {
            var index = _reminders.FindIndex(r => r.UserId == reminder.UserId && r.Id == reminder.Id);
            if (index < 0)
                return Task.FromResult(false);

            _reminders[index] = reminder;
            return Task.FromResult(true);
        }
    }

    public Task<bool> DeleteAsync(UserId userId, Guid id)
    {
        lock (_lock)
        {
            var reminder = _reminders.FirstOrDefault(r => r.UserId == userId && r.Id == id);
            if (reminder is null)
                return Task.FromResult(false);

            _reminders.Remove(reminder);
            return Task.FromResult(true);
        }
    }
}

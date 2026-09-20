using Reforge.Domain;
using Reforge.Core.Reminders.Domain;
using Reforge.Core.Reminders.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeCustomReminderRepository : ICustomReminderRepository
{
    private readonly List<CustomReminder> _reminders = [];

    public Task<List<CustomReminder>> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_reminders.Where(r => r.UserId == userId).ToList());

    public Task AddAsync(CustomReminder reminder)
    {
        _reminders.Add(reminder);
        return Task.CompletedTask;
    }

    public Task<bool> UpdateAsync(CustomReminder reminder)
    {
        var index = _reminders.FindIndex(r => r.UserId == reminder.UserId && r.Id == reminder.Id);
        if (index < 0)
            return Task.FromResult(false);

        _reminders[index] = reminder;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAsync(UserId userId, Guid id)
    {
        var reminder = _reminders.FirstOrDefault(r => r.UserId == userId && r.Id == id);
        if (reminder is null)
            return Task.FromResult(false);

        _reminders.Remove(reminder);
        return Task.FromResult(true);
    }

    public void Seed(CustomReminder reminder) => _reminders.Add(reminder);
}

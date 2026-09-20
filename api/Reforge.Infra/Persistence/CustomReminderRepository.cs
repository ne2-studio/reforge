using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Reminders.Domain;
using Reforge.Core.Reminders.OutputPorts;

namespace Reforge.Infra.Persistence;

public class CustomReminderRepository(ReforgeDbContext dbContext) : ICustomReminderRepository
{
    public Task<List<CustomReminder>> GetByUserIdAsync(UserId userId) =>
        dbContext.CustomReminders.AsNoTracking()
            .Where(r => r.UserId == userId)
            .ToListAsync();

    public async Task AddAsync(CustomReminder reminder)
    {
        dbContext.CustomReminders.Add(reminder);
        await dbContext.SaveChangesAsync();
    }

    public async Task<bool> UpdateAsync(CustomReminder reminder)
    {
        var existing = await dbContext.CustomReminders
            .FirstOrDefaultAsync(r => r.UserId == reminder.UserId && r.Id == reminder.Id);
        if (existing is null)
            return false;

        dbContext.Entry(existing).CurrentValues.SetValues(reminder);
        await dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(UserId userId, Guid id)
    {
        var reminder = await dbContext.CustomReminders
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Id == id);
        if (reminder is null)
            return false;

        dbContext.CustomReminders.Remove(reminder);
        await dbContext.SaveChangesAsync();
        return true;
    }
}

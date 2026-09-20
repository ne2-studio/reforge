using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Reminders.Domain;
using Reforge.Core.Reminders.OutputPorts;

namespace Reforge.Infra.Persistence;

public class ReminderSettingsRepository(ReforgeDbContext dbContext) : IReminderSettingsRepository
{
    public Task<ReminderSettings?> GetByUserIdAsync(UserId userId) =>
        dbContext.ReminderSettings.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId);

    // Mirrors ProfileRepository.UpsertAsync: load the tracked row and copy every scalar property
    // onto it, rather than raw SQL, so EF's own change tracking decides what actually changed.
    public async Task UpsertAsync(ReminderSettings settings)
    {
        var existing = await dbContext.ReminderSettings.FirstOrDefaultAsync(s => s.UserId == settings.UserId);
        if (existing is null)
        {
            dbContext.ReminderSettings.Add(settings);
        }
        else
        {
            dbContext.Entry(existing).CurrentValues.SetValues(settings);
        }

        await dbContext.SaveChangesAsync();
    }
}

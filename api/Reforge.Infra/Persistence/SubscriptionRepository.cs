using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Infra.Persistence;

public class SubscriptionRepository(ReforgeDbContext dbContext) : ISubscriptionRepository
{
    public Task<Subscription?> GetByUserIdAsync(UserId userId) =>
        dbContext.Subscriptions.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId);

    // Mirrors ProfileRepository.UpsertAsync/ReminderSettingsRepository.UpsertAsync: load the
    // tracked row and copy every scalar property onto it, rather than raw SQL, so EF's own change
    // tracking decides what actually changed.
    public async Task UpsertAsync(Subscription subscription)
    {
        var existing = await dbContext.Subscriptions.FirstOrDefaultAsync(s => s.UserId == subscription.UserId);
        if (existing is null)
        {
            dbContext.Subscriptions.Add(subscription);
        }
        else
        {
            dbContext.Entry(existing).CurrentValues.SetValues(subscription);
        }

        await dbContext.SaveChangesAsync();
    }
}

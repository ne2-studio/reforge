using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Infra.Persistence;

public class UsageRepository(ReforgeDbContext dbContext) : IUsageRepository
{
    public async Task<int> GetCountAsync(UserId userId, UsageAction action, DateOnly month)
    {
        var record = await dbContext.UsageRecords.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId && u.Action == action && u.Month == month);

        return record?.Count ?? 0;
    }

    public async Task IncrementAsync(UserId userId, UsageAction action, DateOnly month)
    {
        var existing = await dbContext.UsageRecords
            .FirstOrDefaultAsync(u => u.UserId == userId && u.Action == action && u.Month == month);

        if (existing is null)
        {
            dbContext.UsageRecords.Add(new UsageRecord(Guid.NewGuid(), userId, action, month, count: 1));
        }
        else
        {
            dbContext.Entry(existing).CurrentValues.SetValues(
                new UsageRecord(existing.Id, existing.UserId, existing.Action, existing.Month, existing.Count + 1));
        }

        await dbContext.SaveChangesAsync();
    }
}

using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Activities.Domain;
using Reforge.Core.Activities.OutputPorts;

namespace Reforge.Infra.Persistence;

public class ActivityRepository(ReforgeDbContext dbContext) : IActivityRepository
{
    public Task<List<Activity>> GetByUserIdAsync(UserId userId) =>
        dbContext.Activities.AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

    public async Task AddAsync(Activity activity)
    {
        dbContext.Activities.Add(activity);
        await dbContext.SaveChangesAsync();
    }
}

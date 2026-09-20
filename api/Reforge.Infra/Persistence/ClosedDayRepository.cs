using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.ClosedDays.Domain;
using Reforge.Core.ClosedDays.OutputPorts;

namespace Reforge.Infra.Persistence;

public class ClosedDayRepository(ReforgeDbContext dbContext) : IClosedDayRepository
{
    public Task<List<ClosedDay>> GetByUserIdAsync(UserId userId) =>
        dbContext.ClosedDays.AsNoTracking()
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.Date)
            .ToListAsync();

    public Task<ClosedDay?> GetByUserIdAndDateAsync(UserId userId, DateOnly date) =>
        dbContext.ClosedDays.AsNoTracking()
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Date == date);

    public async Task AddAsync(ClosedDay closedDay)
    {
        dbContext.ClosedDays.Add(closedDay);
        await dbContext.SaveChangesAsync();
    }
}

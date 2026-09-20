using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Measurements.Domain;
using Reforge.Core.Measurements.OutputPorts;

namespace Reforge.Infra.Persistence;

public class MeasurementRepository(ReforgeDbContext dbContext) : IMeasurementRepository
{
    public Task<List<Measurement>> GetByUserIdAsync(UserId userId) =>
        dbContext.Measurements.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();

    public async Task AddAsync(Measurement measurement)
    {
        dbContext.Measurements.Add(measurement);
        await dbContext.SaveChangesAsync();
    }
}

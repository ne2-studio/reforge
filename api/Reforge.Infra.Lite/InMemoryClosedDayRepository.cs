using Reforge.Domain;
using Reforge.Core.ClosedDays.Domain;
using Reforge.Core.ClosedDays.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryMeasurementRepository.
public class InMemoryClosedDayRepository : IClosedDayRepository
{
    private readonly List<ClosedDay> _closedDays = [];
    private readonly Lock _lock = new();

    public Task<List<ClosedDay>> GetByUserIdAsync(UserId userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_closedDays
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.Date)
                .ToList());
        }
    }

    public Task<ClosedDay?> GetByUserIdAndDateAsync(UserId userId, DateOnly date)
    {
        lock (_lock)
        {
            return Task.FromResult(_closedDays
                .FirstOrDefault(d => d.UserId == userId && d.Date == date));
        }
    }

    public Task AddAsync(ClosedDay closedDay)
    {
        lock (_lock) _closedDays.Add(closedDay);
        return Task.CompletedTask;
    }
}

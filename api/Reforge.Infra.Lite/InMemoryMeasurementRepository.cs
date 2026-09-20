using Reforge.Domain;
using Reforge.Core.Measurements.Domain;
using Reforge.Core.Measurements.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryActivityRepository.
public class InMemoryMeasurementRepository : IMeasurementRepository
{
    private readonly List<Measurement> _measurements = [];
    private readonly Lock _lock = new();

    public Task<List<Measurement>> GetByUserIdAsync(UserId userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_measurements
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.Timestamp)
                .ToList());
        }
    }

    public Task AddAsync(Measurement measurement)
    {
        lock (_lock) _measurements.Add(measurement);
        return Task.CompletedTask;
    }
}

using Reforge.Domain;
using Reforge.Core.Measurements.Domain;
using Reforge.Core.Measurements.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeMeasurementRepository : IMeasurementRepository
{
    private readonly List<Measurement> _measurements = [];

    public Task<List<Measurement>> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_measurements
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Timestamp)
            .ToList());

    public Task AddAsync(Measurement measurement)
    {
        _measurements.Add(measurement);
        return Task.CompletedTask;
    }

    public void Seed(Measurement measurement) => _measurements.Add(measurement);
}

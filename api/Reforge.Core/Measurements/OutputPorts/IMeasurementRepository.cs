using Reforge.Domain;
using Reforge.Core.Measurements.Domain;

namespace Reforge.Core.Measurements.OutputPorts;

public interface IMeasurementRepository
{
    /// <summary>The caller's own measurements, most recent first (by Timestamp descending).</summary>
    Task<List<Measurement>> GetByUserIdAsync(UserId userId);

    Task AddAsync(Measurement measurement);
}

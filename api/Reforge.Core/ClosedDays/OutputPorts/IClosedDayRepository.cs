using Reforge.Domain;
using Reforge.Core.ClosedDays.Domain;

namespace Reforge.Core.ClosedDays.OutputPorts;

public interface IClosedDayRepository
{
    /// <summary>All of the caller's own closed days, most recent first (by Date descending).</summary>
    Task<List<ClosedDay>> GetByUserIdAsync(UserId userId);

    Task<ClosedDay?> GetByUserIdAndDateAsync(UserId userId, DateOnly date);

    Task AddAsync(ClosedDay closedDay);
}

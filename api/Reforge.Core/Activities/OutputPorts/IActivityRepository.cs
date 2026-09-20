using Reforge.Domain;
using Reforge.Core.Activities.Domain;

namespace Reforge.Core.Activities.OutputPorts;

public interface IActivityRepository
{
    /// <summary>The caller's own activities, most recent first (by Timestamp descending).</summary>
    Task<List<Activity>> GetByUserIdAsync(UserId userId);

    Task AddAsync(Activity activity);
}

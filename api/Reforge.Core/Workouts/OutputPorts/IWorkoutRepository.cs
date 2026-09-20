using Reforge.Domain;
using Reforge.Core.Workouts.Domain;

namespace Reforge.Core.Workouts.OutputPorts;

public interface IWorkoutRepository
{
    /// <summary>The caller's own workouts, most recent first (by Timestamp descending).</summary>
    Task<List<Workout>> GetByUserIdAsync(UserId userId);

    Task AddAsync(Workout workout);
}

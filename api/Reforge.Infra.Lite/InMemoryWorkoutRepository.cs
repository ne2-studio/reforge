using Reforge.Domain;
using Reforge.Core.Workouts.Domain;
using Reforge.Core.Workouts.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryMealRepository.
public class InMemoryWorkoutRepository : IWorkoutRepository
{
    private readonly List<Workout> _workouts = [];
    private readonly Lock _lock = new();

    public Task<List<Workout>> GetByUserIdAsync(UserId userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_workouts
                .Where(w => w.UserId == userId)
                .OrderByDescending(w => w.Timestamp)
                .ToList());
        }
    }

    public Task AddAsync(Workout workout)
    {
        lock (_lock) _workouts.Add(workout);
        return Task.CompletedTask;
    }
}

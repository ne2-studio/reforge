using Reforge.Domain;
using Reforge.Core.Activities.Domain;
using Reforge.Core.Activities.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryMealRepository.
public class InMemoryActivityRepository : IActivityRepository
{
    private readonly List<Activity> _activities = [];
    private readonly Lock _lock = new();

    public Task<List<Activity>> GetByUserIdAsync(UserId userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_activities
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .ToList());
        }
    }

    public Task AddAsync(Activity activity)
    {
        lock (_lock) _activities.Add(activity);
        return Task.CompletedTask;
    }
}

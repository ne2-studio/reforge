using Reforge.Domain;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Meals.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryProfileRepository.
public class InMemoryMealRepository : IMealRepository
{
    private readonly List<Meal> _meals = [];
    private readonly Lock _lock = new();

    public Task<List<Meal>> GetByUserIdAsync(UserId userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_meals
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.Timestamp)
                .ToList());
        }
    }

    public Task<List<Meal>> GetByUserIdAndDateAsync(UserId userId, DateOnly date)
    {
        lock (_lock)
        {
            return Task.FromResult(_meals
                .Where(m => m.UserId == userId && m.Date == date)
                .ToList());
        }
    }

    public Task AddAsync(Meal meal)
    {
        lock (_lock) _meals.Add(meal);
        return Task.CompletedTask;
    }
}

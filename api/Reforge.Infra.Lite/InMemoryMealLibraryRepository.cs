using Reforge.Domain;
using Reforge.Core.MealLibrary.Domain;
using Reforge.Core.MealLibrary.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryMealRepository.
public class InMemoryMealLibraryRepository : IMealLibraryRepository
{
    private readonly List<MealLibraryItem> _items = [];
    private readonly Lock _lock = new();

    public Task<List<MealLibraryItem>> GetByUserIdAsync(UserId userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_items
                .Where(m => m.UserId == userId)
                .ToList());
        }
    }

    public Task AddAsync(MealLibraryItem item)
    {
        lock (_lock) _items.Add(item);
        return Task.CompletedTask;
    }

    public Task<bool> DeleteAsync(UserId userId, Guid id)
    {
        lock (_lock)
        {
            var item = _items.FirstOrDefault(m => m.UserId == userId && m.Id == id);
            if (item is null)
                return Task.FromResult(false);

            _items.Remove(item);
            return Task.FromResult(true);
        }
    }
}

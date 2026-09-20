using Reforge.Domain;
using Reforge.Core.MealLibrary.Domain;
using Reforge.Core.MealLibrary.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeMealLibraryRepository : IMealLibraryRepository
{
    private readonly List<MealLibraryItem> _items = [];

    public Task<List<MealLibraryItem>> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_items
            .Where(m => m.UserId == userId)
            .ToList());

    public Task AddAsync(MealLibraryItem item)
    {
        _items.Add(item);
        return Task.CompletedTask;
    }

    public Task<bool> DeleteAsync(UserId userId, Guid id)
    {
        var item = _items.FirstOrDefault(m => m.UserId == userId && m.Id == id);
        if (item is null)
            return Task.FromResult(false);

        _items.Remove(item);
        return Task.FromResult(true);
    }

    public void Seed(MealLibraryItem item) => _items.Add(item);
}

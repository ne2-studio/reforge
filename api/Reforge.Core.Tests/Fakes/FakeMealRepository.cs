using Reforge.Domain;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Meals.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeMealRepository : IMealRepository
{
    private readonly List<Meal> _meals = [];

    public Task<List<Meal>> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_meals
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Timestamp)
            .ToList());

    public Task<List<Meal>> GetByUserIdAndDateAsync(UserId userId, DateOnly date) =>
        Task.FromResult(_meals
            .Where(m => m.UserId == userId && m.Date == date)
            .ToList());

    public Task AddAsync(Meal meal)
    {
        _meals.Add(meal);
        return Task.CompletedTask;
    }

    public void Seed(Meal meal) => _meals.Add(meal);
}

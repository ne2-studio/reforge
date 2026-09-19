using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Meals.OutputPorts;

namespace Reforge.Infra.Persistence;

public class MealRepository(ReforgeDbContext dbContext) : IMealRepository
{
    public Task<List<Meal>> GetByUserIdAsync(UserId userId) =>
        dbContext.Meals.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Timestamp)
            .ToListAsync();

    public Task<List<Meal>> GetByUserIdAndDateAsync(UserId userId, DateOnly date) =>
        dbContext.Meals.AsNoTracking()
            .Where(m => m.UserId == userId && m.Date == date)
            .ToListAsync();

    public async Task AddAsync(Meal meal)
    {
        dbContext.Meals.Add(meal);
        await dbContext.SaveChangesAsync();
    }
}

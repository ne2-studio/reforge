using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Workouts.Domain;
using Reforge.Core.Workouts.OutputPorts;

namespace Reforge.Infra.Persistence;

public class WorkoutRepository(ReforgeDbContext dbContext) : IWorkoutRepository
{
    public Task<List<Workout>> GetByUserIdAsync(UserId userId) =>
        dbContext.Workouts.AsNoTracking()
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.Timestamp)
            .ToListAsync();

    public async Task AddAsync(Workout workout)
    {
        dbContext.Workouts.Add(workout);
        await dbContext.SaveChangesAsync();
    }
}

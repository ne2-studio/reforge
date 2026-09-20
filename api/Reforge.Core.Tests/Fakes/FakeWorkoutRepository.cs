using Reforge.Domain;
using Reforge.Core.Workouts.Domain;
using Reforge.Core.Workouts.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeWorkoutRepository : IWorkoutRepository
{
    private readonly List<Workout> _workouts = [];

    public Task<List<Workout>> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_workouts
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.Timestamp)
            .ToList());

    public Task AddAsync(Workout workout)
    {
        _workouts.Add(workout);
        return Task.CompletedTask;
    }

    public void Seed(Workout workout) => _workouts.Add(workout);
}

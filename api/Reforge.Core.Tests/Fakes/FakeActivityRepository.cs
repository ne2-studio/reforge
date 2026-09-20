using Reforge.Domain;
using Reforge.Core.Activities.Domain;
using Reforge.Core.Activities.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeActivityRepository : IActivityRepository
{
    private readonly List<Activity> _activities = [];

    public Task<List<Activity>> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_activities
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .ToList());

    public Task AddAsync(Activity activity)
    {
        _activities.Add(activity);
        return Task.CompletedTask;
    }

    public void Seed(Activity activity) => _activities.Add(activity);
}

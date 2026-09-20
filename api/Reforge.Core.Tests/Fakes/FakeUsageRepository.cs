using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeUsageRepository : IUsageRepository
{
    private readonly List<UsageRecord> _records = [];

    public Task<int> GetCountAsync(UserId userId, UsageAction action, DateOnly month)
    {
        var record = _records.FirstOrDefault(r => r.UserId == userId && r.Action == action && r.Month == month);
        return Task.FromResult(record?.Count ?? 0);
    }

    public Task IncrementAsync(UserId userId, UsageAction action, DateOnly month)
    {
        var index = _records.FindIndex(r => r.UserId == userId && r.Action == action && r.Month == month);
        if (index < 0)
            _records.Add(new UsageRecord(Guid.NewGuid(), userId, action, month, count: 1));
        else
            _records[index] = new UsageRecord(_records[index].Id, userId, action, month, _records[index].Count + 1);

        return Task.CompletedTask;
    }

    public void Seed(UserId userId, UsageAction action, DateOnly month, int count) =>
        _records.Add(new UsageRecord(Guid.NewGuid(), userId, action, month, count));
}

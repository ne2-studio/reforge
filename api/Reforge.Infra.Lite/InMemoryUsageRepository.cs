using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryChatMessageRepository.
public class InMemoryUsageRepository : IUsageRepository
{
    private readonly List<UsageRecord> _records = [];
    private readonly Lock _lock = new();

    public Task<int> GetCountAsync(UserId userId, UsageAction action, DateOnly month)
    {
        lock (_lock)
        {
            var record = _records.FirstOrDefault(r => r.UserId == userId && r.Action == action && r.Month == month);
            return Task.FromResult(record?.Count ?? 0);
        }
    }

    public Task IncrementAsync(UserId userId, UsageAction action, DateOnly month)
    {
        lock (_lock)
        {
            var index = _records.FindIndex(r => r.UserId == userId && r.Action == action && r.Month == month);
            if (index < 0)
            {
                _records.Add(new UsageRecord(Guid.NewGuid(), userId, action, month, count: 1));
            }
            else
            {
                var existing = _records[index];
                _records[index] = new UsageRecord(existing.Id, existing.UserId, existing.Action, existing.Month, existing.Count + 1);
            }

            return Task.CompletedTask;
        }
    }
}

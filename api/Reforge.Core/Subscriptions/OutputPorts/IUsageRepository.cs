using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Core.Subscriptions.OutputPorts;

public interface IUsageRepository
{
    /// <summary>The caller's usage count for the given action in the given calendar month (see
    /// UsageRecord.Month's doc comment for the "first of the month" convention). Zero if no
    /// UsageRecord exists yet.</summary>
    Task<int> GetCountAsync(UserId userId, UsageAction action, DateOnly month);

    /// <summary>Atomically creates the record at count 1 if none exists yet for this
    /// (userId, action, month), or increments the existing one by 1 otherwise.</summary>
    Task IncrementAsync(UserId userId, UsageAction action, DateOnly month);
}

using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryReminderSettingsRepository.
public class InMemorySubscriptionRepository : ISubscriptionRepository
{
    private readonly Dictionary<UserId, Subscription> _subscriptions = new();
    private readonly Lock _lock = new();

    public Task<Subscription?> GetByUserIdAsync(UserId userId)
    {
        lock (_lock) return Task.FromResult(_subscriptions.GetValueOrDefault(userId));
    }

    public Task UpsertAsync(Subscription subscription)
    {
        lock (_lock) _subscriptions[subscription.UserId] = subscription;
        return Task.CompletedTask;
    }
}

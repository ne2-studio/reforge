using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeSubscriptionRepository : ISubscriptionRepository
{
    private readonly Dictionary<UserId, Subscription> _subscriptions = new();

    public Task<Subscription?> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_subscriptions.GetValueOrDefault(userId));

    public Task UpsertAsync(Subscription subscription)
    {
        _subscriptions[subscription.UserId] = subscription;
        return Task.CompletedTask;
    }

    public void Seed(Subscription subscription) => _subscriptions[subscription.UserId] = subscription;
}

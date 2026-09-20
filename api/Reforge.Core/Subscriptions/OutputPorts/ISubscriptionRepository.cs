using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Core.Subscriptions.OutputPorts;

public interface ISubscriptionRepository
{
    /// <summary>Null if the caller has never checked out — see
    /// Subscription.CreateDefault for how callers should treat that.</summary>
    Task<Subscription?> GetByUserIdAsync(UserId userId);

    /// <summary>Inserts the subscription if none exists yet for this user, or fully replaces the
    /// existing one otherwise — mirrors IProfileRepository.UpsertAsync/IReminderSettingsRepository
    /// .UpsertAsync.</summary>
    Task UpsertAsync(Subscription subscription);
}

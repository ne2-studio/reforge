using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors
// InMemoryCustomReminderRepository.
public class InMemoryCheckoutSessionRepository : ICheckoutSessionRepository
{
    private readonly List<CheckoutSession> _sessions = [];
    private readonly Lock _lock = new();

    public Task<CheckoutSession?> GetByIdAsync(Guid sessionId)
    {
        lock (_lock) return Task.FromResult(_sessions.FirstOrDefault(s => s.Id == sessionId));
    }

    public Task AddAsync(CheckoutSession session)
    {
        lock (_lock) _sessions.Add(session);
        return Task.CompletedTask;
    }

    public Task<bool> UpdateAsync(CheckoutSession session)
    {
        lock (_lock)
        {
            var index = _sessions.FindIndex(s => s.UserId == session.UserId && s.Id == session.Id);
            if (index < 0)
                return Task.FromResult(false);

            _sessions[index] = session;
            return Task.FromResult(true);
        }
    }
}

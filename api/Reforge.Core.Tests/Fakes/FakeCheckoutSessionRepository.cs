using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeCheckoutSessionRepository : ICheckoutSessionRepository
{
    private readonly List<CheckoutSession> _sessions = [];

    public Task<CheckoutSession?> GetByIdAsync(Guid sessionId) =>
        Task.FromResult(_sessions.FirstOrDefault(s => s.Id == sessionId));

    public Task AddAsync(CheckoutSession session)
    {
        _sessions.Add(session);
        return Task.CompletedTask;
    }

    public Task<bool> UpdateAsync(CheckoutSession session)
    {
        var index = _sessions.FindIndex(s => s.UserId == session.UserId && s.Id == session.Id);
        if (index < 0)
            return Task.FromResult(false);

        _sessions[index] = session;
        return Task.FromResult(true);
    }

    public void Seed(CheckoutSession session) => _sessions.Add(session);
}

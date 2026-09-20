using Reforge.Domain;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Core.Subscriptions.OutputPorts;

public interface ICheckoutSessionRepository
{
    Task<CheckoutSession?> GetByIdAsync(Guid sessionId);

    Task AddAsync(CheckoutSession session);

    /// <summary>Replaces the session with the given id, scoped to the given UserId — a caller can
    /// never update another user's session. Returns true if a session was found and updated,
    /// false otherwise (mirrors ICustomReminderRepository.UpdateAsync's existence
    /// semantics).</summary>
    Task<bool> UpdateAsync(CheckoutSession session);
}

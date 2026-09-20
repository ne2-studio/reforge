using Microsoft.EntityFrameworkCore;
using Reforge.Core.Subscriptions.Domain;
using Reforge.Core.Subscriptions.OutputPorts;

namespace Reforge.Infra.Persistence;

public class CheckoutSessionRepository(ReforgeDbContext dbContext) : ICheckoutSessionRepository
{
    public Task<CheckoutSession?> GetByIdAsync(Guid sessionId) =>
        dbContext.CheckoutSessions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == sessionId);

    public async Task AddAsync(CheckoutSession session)
    {
        dbContext.CheckoutSessions.Add(session);
        await dbContext.SaveChangesAsync();
    }

    // Mirrors CustomReminderRepository.UpdateAsync's existence semantics, scoped by (UserId, Id).
    public async Task<bool> UpdateAsync(CheckoutSession session)
    {
        var existing = await dbContext.CheckoutSessions
            .FirstOrDefaultAsync(s => s.UserId == session.UserId && s.Id == session.Id);
        if (existing is null)
            return false;

        dbContext.Entry(existing).CurrentValues.SetValues(session);
        await dbContext.SaveChangesAsync();
        return true;
    }
}

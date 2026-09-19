using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Users.Domain;
using Reforge.Core.Users.OutputPorts;

namespace Reforge.Infra.Persistence;

public class UserRepository(ReforgeDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByIdAsync(UserId id) =>
        dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);

    public Task UpdateLastAccessAsync(UserId id, DateTime at) =>
        dbContext.Users
            .Where(u => u.Id == id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(u => u.LastAccessAt, at));

    // ON CONFLICT DO NOTHING: UserSyncMiddleware calls this only after failing to find the row,
    // and a single page load routinely fires several authenticated requests in parallel — for a
    // brand-new user more than one can land here concurrently. Letting Postgres itself absorb
    // the race (rather than a SELECT-then-INSERT check-then-act) avoids a duplicate-key failure.
    public async Task UpsertAsync(User user)
    {
        await dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"""
             INSERT INTO "Users" ("Id", "CreatedAt", "LastAccessAt")
             VALUES ({user.Id.Value}, {user.CreatedAt}, {user.LastAccessAt})
             ON CONFLICT ("Id") DO NOTHING
             """);
    }
}

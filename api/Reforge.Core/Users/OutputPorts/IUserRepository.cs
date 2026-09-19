using Reforge.Domain;
using Reforge.Core.Users.Domain;

namespace Reforge.Core.Users.OutputPorts;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(UserId id);

    /// <summary>
    /// Inserts the user if new, or leaves it untouched if already present. Called by
    /// UserSyncMiddleware the first time a given "sub" is seen — OIDC access tokens carry no
    /// admin API to look up users ahead of time.
    /// </summary>
    Task UpsertAsync(User user);

    /// <summary>
    /// Updates just the LastAccessAt column, throttled by UserSyncMiddleware so it isn't a DB
    /// write on every single authenticated request.
    /// </summary>
    Task UpdateLastAccessAsync(UserId id, DateTime at);
}

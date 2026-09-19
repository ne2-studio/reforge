using Reforge.Domain;
using Reforge.Core.Users.Domain;
using Reforge.Core.Users.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors el-baul's
// InMemoryUserRepository, including the locking, since a live ASP.NET Core app fires genuinely
// concurrent requests at this.
public class InMemoryUserRepository : IUserRepository
{
    private readonly Dictionary<UserId, User> _users = new();
    private readonly Lock _lock = new();

    public Task<User?> GetByIdAsync(UserId id)
    {
        lock (_lock) return Task.FromResult(_users.GetValueOrDefault(id));
    }

    public Task UpsertAsync(User user)
    {
        lock (_lock) _users.TryAdd(user.Id, user);
        return Task.CompletedTask;
    }

    public Task UpdateLastAccessAsync(UserId id, DateTime at)
    {
        lock (_lock)
        {
            if (_users.TryGetValue(id, out var user))
            {
                _users[id] = user.WithLastAccessAt(at);
            }
        }
        return Task.CompletedTask;
    }
}

using Reforge.Domain;
using Reforge.Core.Users.Domain;
using Reforge.Core.Users.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeUserRepository : IUserRepository
{
    private readonly Dictionary<UserId, User> _users = new();

    public Task<User?> GetByIdAsync(UserId id) => Task.FromResult(_users.GetValueOrDefault(id));

    public Task UpsertAsync(User user)
    {
        _users.TryAdd(user.Id, user);
        return Task.CompletedTask;
    }

    public Task UpdateLastAccessAsync(UserId id, DateTime at)
    {
        if (_users.TryGetValue(id, out var user)) _users[id] = user.WithLastAccessAt(at);
        return Task.CompletedTask;
    }

    public void Seed(User user) => _users[user.Id] = user;
}

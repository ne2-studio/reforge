using Reforge.Domain;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeProfileRepository : IProfileRepository
{
    private readonly Dictionary<UserId, UserProfile> _profiles = new();

    public Task<UserProfile?> GetByUserIdAsync(UserId userId) => Task.FromResult(_profiles.GetValueOrDefault(userId));

    public Task UpsertAsync(UserProfile profile)
    {
        _profiles[profile.UserId] = profile;
        return Task.CompletedTask;
    }

    public void Seed(UserProfile profile) => _profiles[profile.UserId] = profile;
}

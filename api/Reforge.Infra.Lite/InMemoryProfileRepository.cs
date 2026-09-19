using Reforge.Domain;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors InMemoryUserRepository.
public class InMemoryProfileRepository : IProfileRepository
{
    private readonly Dictionary<UserId, UserProfile> _profiles = new();
    private readonly Lock _lock = new();

    public Task<UserProfile?> GetByUserIdAsync(UserId userId)
    {
        lock (_lock) return Task.FromResult(_profiles.GetValueOrDefault(userId));
    }

    public Task UpsertAsync(UserProfile profile)
    {
        lock (_lock) _profiles[profile.UserId] = profile;
        return Task.CompletedTask;
    }
}

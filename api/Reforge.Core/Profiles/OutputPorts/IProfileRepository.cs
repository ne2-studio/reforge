using Reforge.Domain;
using Reforge.Core.Profiles.Domain;

namespace Reforge.Core.Profiles.OutputPorts;

public interface IProfileRepository
{
    Task<UserProfile?> GetByUserIdAsync(UserId userId);

    /// <summary>
    /// Inserts the profile if none exists yet for this user, or fully replaces the existing one
    /// otherwise — POST /profile always submits the whole profile, not a partial patch, mirroring
    /// the source backend's saveProfile behavior.
    /// </summary>
    Task UpsertAsync(UserProfile profile);
}

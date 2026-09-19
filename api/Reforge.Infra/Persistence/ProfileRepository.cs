using Microsoft.EntityFrameworkCore;
using Reforge.Domain;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;

namespace Reforge.Infra.Persistence;

public class ProfileRepository(ReforgeDbContext dbContext) : IProfileRepository
{
    public Task<UserProfile?> GetByUserIdAsync(UserId userId) =>
        dbContext.UserProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId);

    // Unlike UserRepository.UpsertAsync (insert-if-new, otherwise no-op), a profile save always
    // fully replaces whatever was there — POST /profile always submits the whole profile.
    // Loading the tracked row and copying every scalar/JSON property onto it (rather than raw
    // SQL) lets EF's own change tracking + the JSON columns' ValueComparers
    // (UserProfileConfiguration) decide what actually changed.
    public async Task UpsertAsync(UserProfile profile)
    {
        var existing = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == profile.UserId);
        if (existing is null)
        {
            dbContext.UserProfiles.Add(profile);
        }
        else
        {
            dbContext.Entry(existing).CurrentValues.SetValues(profile);
        }

        await dbContext.SaveChangesAsync();
    }
}

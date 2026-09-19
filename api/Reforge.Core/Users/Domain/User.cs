using Reforge.Domain;

namespace Reforge.Core.Users.Domain;

// The walking skeleton's one real entity: a sync-on-first-request row for an authenticated
// OIDC "sub", just enough to prove OIDC + EF Core + migrations work end to end. See
// UserSyncMiddleware (Reforge.Infra.Common) for who creates/updates it.
public sealed class User
{
    public UserId Id { get; }
    public DateTime CreatedAt { get; }
    public DateTime? LastAccessAt { get; private set; }

    public User(UserId id, DateTime createdAt, DateTime? lastAccessAt = null)
    {
        Id = id;
        CreatedAt = createdAt;
        LastAccessAt = lastAccessAt;
    }

    public User WithLastAccessAt(DateTime at)
    {
        LastAccessAt = at;
        return this;
    }
}

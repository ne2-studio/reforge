namespace Reforge.Domain;

// Wraps the OIDC "sub" claim backing User.Id. Unlike a Guid-keyed domain entity id, this is
// deliberately unvalidated: OIDC subject ids aren't guaranteed GUID-shaped, and the claim is
// opaque — there's nothing to check beyond "a string was supplied". See
// docs/architecture/backend.md#data-access.
public readonly record struct UserId(string Value)
{
    public static implicit operator string(UserId id) => id.Value;
    public override string ToString() => Value;
}

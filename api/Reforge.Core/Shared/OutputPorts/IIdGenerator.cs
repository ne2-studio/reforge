namespace Reforge.Core.Shared.OutputPorts;

// First real use: Meal's server-generated Guid id (Slice 2, docs/plan/02-vertical-slices.md) —
// meals are a proper collection (many per user), unlike UserProfile which is keyed by UserId
// itself and never needed a surrogate key generator.
public interface IIdGenerator
{
    Guid NewId();
}

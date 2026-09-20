using Reforge.Domain;
using Reforge.Core.MealLibrary.Domain;

namespace Reforge.Core.MealLibrary.OutputPorts;

public interface IMealLibraryRepository
{
    /// <summary>The caller's own meal library items.</summary>
    Task<List<MealLibraryItem>> GetByUserIdAsync(UserId userId);

    Task AddAsync(MealLibraryItem item);

    /// <summary>Deletes the item with the given id, scoped to the given userId — a caller can
    /// never delete another user's item. Returns true if an item was found and deleted, false if
    /// no such item exists for that user (either it never existed, or it belongs to someone
    /// else).</summary>
    Task<bool> DeleteAsync(UserId userId, Guid id);
}

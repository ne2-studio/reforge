using Reforge.Core.Shared;

namespace Reforge.Core.MealLibrary;

/// <summary>
/// Slice 3 (docs/plan/02-vertical-slices.md): a user's reusable meal templates. Saving to the
/// library is always a create — there's no edit/update use case in scope. All verbs resolve the
/// caller's identity themselves via ICurrentUserProvider; it is never a parameter here.
/// </summary>
public interface IMealLibraryUseCase
{
    /// <summary>The caller's own meal library items.</summary>
    Task<Result<List<MealLibraryItemDto>>> GetLibraryAsync();

    /// <summary>Saves a new item to the caller's meal library and returns it.</summary>
    Task<Result<MealLibraryItemDto>> SaveToLibraryAsync(SaveMealLibraryItemRequestDto request);

    /// <summary>Deletes an item from the caller's own meal library. Fails with NotFound if the
    /// item doesn't exist for the caller — including when it belongs to a different user, so its
    /// existence isn't disclosed (see docs/API-CONVENTIONS.md).</summary>
    Task<Result> DeleteFromLibraryAsync(Guid id);
}

public record MealLibraryItemDto(
    Guid Id,
    string Title,
    string Description,
    string Category,
    int Calories,
    int Protein,
    int Carbs,
    int Fats);

public record SaveMealLibraryItemRequestDto(
    string Title,
    string Description,
    string Category,
    int Calories,
    int Protein,
    int Carbs,
    int Fats);

using Reforge.Core.MealLibrary.Domain;
using Reforge.Core.MealLibrary.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.MealLibrary.Application;

public class MealLibraryManager(
    ICurrentUserProvider currentUserProvider,
    IMealLibraryRepository mealLibraryRepository,
    IIdGenerator idGenerator) : IMealLibraryUseCase
{
    public async Task<Result<List<MealLibraryItemDto>>> GetLibraryAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var items = await mealLibraryRepository.GetByUserIdAsync(userId);
        return Result.Success(items.Select(ToDto).ToList());
    }

    public async Task<Result<MealLibraryItemDto>> SaveToLibraryAsync(SaveMealLibraryItemRequestDto request)
    {
        var userId = currentUserProvider.GetUserId();
        var item = new MealLibraryItem(
            idGenerator.NewId(),
            userId,
            request.Title,
            request.Description,
            request.Category,
            request.Calories,
            request.Protein,
            request.Carbs,
            request.Fats);

        await mealLibraryRepository.AddAsync(item);

        return Result.Success(ToDto(item));
    }

    public async Task<Result> DeleteFromLibraryAsync(Guid id)
    {
        var userId = currentUserProvider.GetUserId();
        var deleted = await mealLibraryRepository.DeleteAsync(userId, id);
        return deleted
            ? Result.Success()
            : Result.Failure(ApplicationError.NotFound("Meal library item not found"));
    }

    private static MealLibraryItemDto ToDto(MealLibraryItem item) => new(
        item.Id,
        item.Title,
        item.Description,
        item.Category,
        item.Calories,
        item.Protein,
        item.Carbs,
        item.Fats);
}

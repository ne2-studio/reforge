using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.MealLibrary;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 3 (docs/plan/02-vertical-slices.md): a user's reusable meal templates. Routed as
/// GET/POST /api/meal-library and DELETE /api/meal-library/{id}. The caller's identity is never a
/// controller parameter; IMealLibraryUseCase resolves it itself via ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class MealLibraryController(IMealLibraryUseCase mealLibraryUseCase) : ControllerBase
{
    [HttpGet("meal-library")]
    [ProducesResponseType(typeof(List<MealLibraryItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLibrary()
    {
        var result = await mealLibraryUseCase.GetLibraryAsync();
        return result.ToActionResult();
    }

    [HttpPost("meal-library")]
    [ProducesResponseType(typeof(MealLibraryItemDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostLibraryItem([FromBody] SaveMealLibraryItemRequestDto request)
    {
        var result = await mealLibraryUseCase.SaveToLibraryAsync(request);
        return result.ToActionResult();
    }

    [HttpDelete("meal-library/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteLibraryItem([FromRoute] Guid id)
    {
        var result = await mealLibraryUseCase.DeleteFromLibraryAsync(id);
        return result.ToActionResult(Ok());
    }
}

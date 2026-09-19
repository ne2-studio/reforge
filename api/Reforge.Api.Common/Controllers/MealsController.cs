using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Meals;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 2 (docs/plan/02-vertical-slices.md): manual meal logging. Routed as GET/POST /api/meals
/// and GET /api/daily-stats/:date — mirroring the source backend's top-level (not /meals-nested)
/// /daily-stats/:date route, see recomp-coach-backend/supabase/functions/server/index.ts. The
/// caller's identity is never a controller parameter; IMealsUseCase resolves it itself via
/// ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class MealsController(IMealsUseCase mealsUseCase) : ControllerBase
{
    [HttpGet("meals")]
    [ProducesResponseType(typeof(List<MealDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeals()
    {
        var result = await mealsUseCase.GetMealsAsync();
        return result.ToActionResult();
    }

    [HttpPost("meals")]
    [ProducesResponseType(typeof(MealDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostMeal([FromBody] SaveMealRequestDto request)
    {
        var result = await mealsUseCase.SaveMealAsync(request);
        return result.ToActionResult();
    }

    [HttpGet("daily-stats/{date}")]
    [ProducesResponseType(typeof(DailyStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDailyStats([FromRoute] DateOnly date)
    {
        var result = await mealsUseCase.GetDailyStatsAsync(date);
        return result.ToActionResult();
    }
}

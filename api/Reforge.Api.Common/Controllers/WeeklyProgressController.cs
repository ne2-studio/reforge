using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.WeeklyProgress;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 7 (docs/plan/02-vertical-slices.md): the weekly-progress view (7-day window,
/// deficit/surplus math, adherence streak, Spanish insights). Split out of the former
/// ClosedDaysController once "day close" was removed from the product. The caller's identity is
/// never a controller parameter; IWeeklyProgressUseCase resolves it itself via
/// ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class WeeklyProgressController(IWeeklyProgressUseCase weeklyProgressUseCase) : ControllerBase
{
    [HttpGet("weekly-progress")]
    [ProducesResponseType(typeof(WeeklyProgressDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWeeklyProgress()
    {
        var result = await weeklyProgressUseCase.GetWeeklyProgressAsync();
        return result.ToActionResult();
    }
}

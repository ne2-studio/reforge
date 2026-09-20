using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.ClosedDays;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 7 (docs/plan/02-vertical-slices.md): manually closing "today" with a deterministic
/// summary, plus the resulting day-history and weekly-progress views. The caller's identity is
/// never a controller parameter; IClosedDaysUseCase resolves it itself via
/// ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class ClosedDaysController(IClosedDaysUseCase closedDaysUseCase) : ControllerBase
{
    [HttpPost("close-day")]
    [ProducesResponseType(typeof(ClosedDayDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CloseDay()
    {
        var result = await closedDaysUseCase.CloseDayAsync();
        return result.ToActionResult();
    }

    [HttpGet("day-history")]
    [ProducesResponseType(typeof(List<ClosedDayDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDayHistory()
    {
        var result = await closedDaysUseCase.GetDayHistoryAsync();
        return result.ToActionResult();
    }

    [HttpGet("weekly-progress")]
    [ProducesResponseType(typeof(WeeklyProgressDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWeeklyProgress()
    {
        var result = await closedDaysUseCase.GetWeeklyProgressAsync();
        return result.ToActionResult();
    }
}

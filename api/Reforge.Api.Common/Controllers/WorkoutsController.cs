using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Workouts;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 4 (docs/plan/02-vertical-slices.md): a user's logged workouts. Routed as GET/POST
/// /api/workouts. The caller's identity is never a controller parameter; IWorkoutsUseCase
/// resolves it itself via ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class WorkoutsController(IWorkoutsUseCase workoutsUseCase) : ControllerBase
{
    [HttpGet("workouts")]
    [ProducesResponseType(typeof(List<WorkoutDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkouts()
    {
        var result = await workoutsUseCase.GetWorkoutsAsync();
        return result.ToActionResult();
    }

    [HttpPost("workouts")]
    [ProducesResponseType(typeof(WorkoutDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostWorkout([FromBody] LogWorkoutRequestDto request)
    {
        var result = await workoutsUseCase.LogWorkoutAsync(request);
        return result.ToActionResult();
    }
}

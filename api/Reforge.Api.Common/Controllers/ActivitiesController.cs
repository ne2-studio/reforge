using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Activities;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 4 (docs/plan/02-vertical-slices.md): a user's logged activities. Routed as GET/POST
/// /api/activities. The caller's identity is never a controller parameter; IActivitiesUseCase
/// resolves it itself via ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class ActivitiesController(IActivitiesUseCase activitiesUseCase) : ControllerBase
{
    [HttpGet("activities")]
    [ProducesResponseType(typeof(List<ActivityDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActivities()
    {
        var result = await activitiesUseCase.GetActivitiesAsync();
        return result.ToActionResult();
    }

    [HttpPost("activities")]
    [ProducesResponseType(typeof(ActivityDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostActivity([FromBody] LogActivityRequestDto request)
    {
        var result = await activitiesUseCase.LogActivityAsync(request);
        return result.ToActionResult();
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Measurements;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 5 (docs/plan/02-vertical-slices.md): a user's logged body measurements. Routed as
/// GET/POST /api/measurements — note the source Node backend inconsistently used singular
/// POST /measurement vs plural GET /measurements; this repo uses the plural form for both,
/// consistent with Activities/Workouts. The caller's identity is never a controller parameter;
/// IMeasurementsUseCase resolves it itself via ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class MeasurementsController(IMeasurementsUseCase measurementsUseCase) : ControllerBase
{
    [HttpGet("measurements")]
    [ProducesResponseType(typeof(List<MeasurementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeasurements()
    {
        var result = await measurementsUseCase.GetMeasurementsAsync();
        return result.ToActionResult();
    }

    [HttpPost("measurements")]
    [ProducesResponseType(typeof(MeasurementDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostMeasurement([FromBody] LogMeasurementRequestDto request)
    {
        var result = await measurementsUseCase.LogMeasurementAsync(request);
        return result.ToActionResult();
    }
}

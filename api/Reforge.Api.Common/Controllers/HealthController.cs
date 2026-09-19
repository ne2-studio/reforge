using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Api.Common.Models;

namespace Reforge.Api.Common.Controllers;

/// <summary>Anonymous liveness check — see docs/API-CONVENTIONS.md's anonymous-exceptions
/// list.</summary>
[AllowAnonymous]
[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public IActionResult Get() => Ok(new HealthResponse("healthy"));
}

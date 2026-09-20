using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Reforge.Api.Common.Models;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 9 (docs/plan/02-vertical-slices.md): lets the frontend know whether the
/// subscriptions/usage-limits feature is turned on, so it can decide whether to show subscription
/// UI / usage bars at all. Always registered regardless of the Features:Subscriptions toggle
/// (unlike SubscriptionsController) — see docs/API-CONVENTIONS.md's anonymous-endpoints list.
/// Reads configuration directly rather than going through Reforge.Core: this is host-layer,
/// informational-only plumbing, not a use case with business logic.
/// </summary>
[AllowAnonymous]
[ApiController]
[Route("api")]
public class FeaturesController(IConfiguration configuration) : ControllerBase
{
    [HttpGet("features")]
    [ProducesResponseType(typeof(FeaturesResponse), StatusCodes.Status200OK)]
    public IActionResult Get() =>
        Ok(new FeaturesResponse(configuration.GetValue<bool>("Features:Subscriptions")));
}

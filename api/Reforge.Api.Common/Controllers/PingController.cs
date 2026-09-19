using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Ping;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// The walking skeleton's one authenticated endpoint — proves OIDC + EF Core + migrations work
/// end to end. The caller's identity is never a controller parameter; the use case resolves it
/// itself via ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api/ping")]
public class PingController(IPingUseCase pingUseCase) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PingResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get()
    {
        var result = await pingUseCase.PingAsync();
        return result.ToActionResult();
    }
}

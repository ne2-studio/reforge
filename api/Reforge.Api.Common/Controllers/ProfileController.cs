using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Profiles;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 1 (docs/plan/02-vertical-slices.md): the authenticated caller's own profile. The
/// caller's identity is never a controller parameter; IProfileUseCase resolves it itself via
/// ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api/profile")]
public class ProfileController(IProfileUseCase profileUseCase) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get()
    {
        var result = await profileUseCase.GetProfileAsync();
        return result.ToActionResult();
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Post([FromBody] SaveProfileRequestDto request)
    {
        var result = await profileUseCase.SaveProfileAsync(request);
        return result.ToActionResult();
    }
}

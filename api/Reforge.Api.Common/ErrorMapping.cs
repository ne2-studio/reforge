using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Shared;

namespace Reforge.Api.Common;

/// <summary>
/// Maps a typed Application-layer error to the shared JSON error response. The observable body
/// is always { "error": "..." } — the status code is driven by ApplicationError.Code, never by
/// message text. See docs/API-CONVENTIONS.md.
/// </summary>
public static class ErrorMapping
{
    public static IActionResult ToActionResult(ApplicationError error)
    {
        var body = new { error = error.Message };

        return error.Code switch
        {
            ApplicationErrorCode.Forbidden => new ObjectResult(body) { StatusCode = StatusCodes.Status403Forbidden },
            ApplicationErrorCode.NotFound => new NotFoundObjectResult(body),
            ApplicationErrorCode.Validation => new BadRequestObjectResult(body),
            ApplicationErrorCode.ExternalDependencyUnavailable => new ObjectResult(body)
            {
                StatusCode = StatusCodes.Status503ServiceUnavailable
            },
            _ => new BadRequestObjectResult(body)
        };
    }
}

using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Shared;

namespace Reforge.Api.Common;

/// <summary>
/// The single "how does a Result become the HTTP response" rule for every controller action.
/// </summary>
public static class ApiResultExtensions
{
    public static IActionResult ToActionResult<T>(this Result<T> result) =>
        result.IsSuccess ? new OkObjectResult(result.Value) : ErrorMapping.ToActionResult(result.Error);

    public static IActionResult ToActionResult(this Result result, IActionResult onSuccess) =>
        result.IsSuccess ? onSuccess : ErrorMapping.ToActionResult(result.Error);
}

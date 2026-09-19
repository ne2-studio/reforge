using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Reforge.Domain;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Infra;

/// <summary>
/// Resolves the logged-in user from the OIDC "sub" claim on the current request's validated
/// JWT. Application/ use-case code never reads HttpContext/claims directly — this and
/// UserSyncMiddleware are the only places that do.
/// </summary>
public class HttpContextCurrentUserProvider(IHttpContextAccessor httpContextAccessor) : ICurrentUserProvider
{
    public UserId GetUserId()
    {
        var user = httpContextAccessor.HttpContext?.User
            ?? throw new InvalidOperationException("No HTTP context is available to resolve the current user.");

        var sub = user.FindFirstValue("sub") ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return new UserId(sub ?? throw new InvalidOperationException("The current user token has no 'sub' claim."));
    }
}

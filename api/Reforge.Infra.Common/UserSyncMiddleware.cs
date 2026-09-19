using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Reforge.Domain;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Users.Domain;
using Reforge.Core.Users.OutputPorts;

namespace Reforge.Infra;

/// <summary>
/// Just-in-time syncs the local Users row for the authenticated "sub" claim, since OIDC access
/// tokens only carry "sub". This is the walking skeleton's one real vertical — see
/// docs/architecture/backend.md#auth. Also touches LastAccessAt on every authenticated
/// request, throttled so it isn't a DB write every single time.
/// Application/ use-case code never reads claims directly — this middleware and
/// HttpContextCurrentUserProvider are the only places that do.
/// </summary>
public class UserSyncMiddleware(RequestDelegate next)
{
    private static readonly TimeSpan LastAccessThrottle = TimeSpan.FromMinutes(15);

    public async Task InvokeAsync(
        HttpContext context,
        IUserRepository userRepository,
        IClock clock,
        ILogger<UserSyncMiddleware> logger)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sub = context.User.FindFirstValue("sub") ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (sub is not null)
            {
                var userId = new UserId(sub);
                var now = clock.UtcNow();
                var existing = await userRepository.GetByIdAsync(userId);

                if (existing is null)
                {
                    await userRepository.UpsertAsync(new User(userId, now, now));
                    logger.LogInformation("Synced new user {Sub}", sub);
                }
                else if (existing.LastAccessAt is null || now - existing.LastAccessAt.Value > LastAccessThrottle)
                {
                    await userRepository.UpdateLastAccessAsync(userId, now);
                }
            }
        }

        await next(context);
    }
}

using Reforge.Core.Shared;

namespace Reforge.Core.Ping;

/// <summary>
/// The walking skeleton's one authenticated vertical: proves OIDC + EF Core + migrations work
/// end to end, not just compile. See docs/architecture/backend.md and
/// docs/plan/01-walking-skeleton.md.
/// </summary>
public interface IPingUseCase
{
    Task<Result<PingResponseDto>> PingAsync();
}

/// <summary>The authenticated caller's synced "sub" and the server's current time.</summary>
public record PingResponseDto(string Sub, DateTime ServerTimeUtc);

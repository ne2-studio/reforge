using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Users.OutputPorts;

namespace Reforge.Core.Ping.Application;

public class PingManager(
    ICurrentUserProvider currentUserProvider,
    IUserRepository userRepository,
    IClock clock) : IPingUseCase
{
    public async Task<Result<PingResponseDto>> PingAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var user = await userRepository.GetByIdAsync(userId);
        if (user is null) return Result.Failure<PingResponseDto>(ApplicationError.NotFound("User not found"));

        return Result.Success(new PingResponseDto(user.Id.Value, clock.UtcNow()));
    }
}

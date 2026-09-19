using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Profiles.Application;

public class ProfileManager(
    ICurrentUserProvider currentUserProvider,
    IProfileRepository profileRepository,
    IClock clock) : IProfileUseCase
{
    public async Task<Result<ProfileDto>> GetProfileAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var profile = await profileRepository.GetByUserIdAsync(userId);
        if (profile is null)
            return Result.Failure<ProfileDto>(ApplicationError.NotFound("Profile not found"));

        return Result.Success(ToDto(profile));
    }

    public async Task<Result<ProfileDto>> SaveProfileAsync(SaveProfileRequestDto request)
    {
        var userId = currentUserProvider.GetUserId();
        var profile = new UserProfile(
            userId,
            clock.UtcNow(),
            request.Age,
            request.Gender,
            request.Height,
            request.Weight,
            request.ActivityLevel,
            request.Goal,
            request.TrainingDays,
            request.TrainingType,
            request.TrainingTime,
            request.Restrictions,
            request.CalorieTarget,
            request.ExtraData);

        await profileRepository.UpsertAsync(profile);

        return Result.Success(ToDto(profile));
    }

    private static ProfileDto ToDto(UserProfile profile) => new(
        profile.Age,
        profile.Gender,
        profile.Height,
        profile.Weight,
        profile.ActivityLevel,
        profile.Goal,
        profile.TrainingDays,
        profile.TrainingType,
        profile.TrainingTime,
        profile.Restrictions,
        profile.CalorieTarget,
        profile.ExtraData,
        profile.UpdatedAt);
}

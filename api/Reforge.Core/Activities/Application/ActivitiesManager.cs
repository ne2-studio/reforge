using Reforge.Core.Activities.Domain;
using Reforge.Core.Activities.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Activities.Application;

public class ActivitiesManager(
    ICurrentUserProvider currentUserProvider,
    IActivityRepository activityRepository,
    IClock clock,
    IIdGenerator idGenerator) : IActivitiesUseCase
{
    public async Task<Result<List<ActivityDto>>> GetActivitiesAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var activities = await activityRepository.GetByUserIdAsync(userId);
        return Result.Success(activities.Select(ToDto).ToList());
    }

    public async Task<Result<ActivityDto>> LogActivityAsync(LogActivityRequestDto request)
    {
        var userId = currentUserProvider.GetUserId();
        var activity = new Activity(
            idGenerator.NewId(),
            userId,
            request.Type,
            timestamp: clock.UtcNow(),
            duration: request.Duration,
            steps: request.Steps);

        await activityRepository.AddAsync(activity);

        return Result.Success(ToDto(activity));
    }

    private static ActivityDto ToDto(Activity activity) => new(
        activity.Id,
        activity.Type,
        activity.Duration,
        activity.Steps,
        activity.Timestamp);
}

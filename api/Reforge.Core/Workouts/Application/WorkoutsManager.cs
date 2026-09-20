using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Workouts.Domain;
using Reforge.Core.Workouts.OutputPorts;

namespace Reforge.Core.Workouts.Application;

public class WorkoutsManager(
    ICurrentUserProvider currentUserProvider,
    IWorkoutRepository workoutRepository,
    IClock clock,
    IIdGenerator idGenerator) : IWorkoutsUseCase
{
    public async Task<Result<List<WorkoutDto>>> GetWorkoutsAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var workouts = await workoutRepository.GetByUserIdAsync(userId);
        return Result.Success(workouts.Select(ToDto).ToList());
    }

    public async Task<Result<WorkoutDto>> LogWorkoutAsync(LogWorkoutRequestDto request)
    {
        var userId = currentUserProvider.GetUserId();
        var workout = new Workout(
            idGenerator.NewId(),
            userId,
            request.Type,
            timestamp: clock.UtcNow(),
            volume: request.Volume,
            duration: request.Duration);

        await workoutRepository.AddAsync(workout);

        return Result.Success(ToDto(workout));
    }

    private static WorkoutDto ToDto(Workout workout) => new(
        workout.Id,
        workout.Type,
        workout.Volume,
        workout.Duration,
        workout.Timestamp);
}

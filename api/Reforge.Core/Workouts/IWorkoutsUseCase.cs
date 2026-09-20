using Reforge.Core.Shared;

namespace Reforge.Core.Workouts;

/// <summary>
/// Slice 4 (docs/plan/02-vertical-slices.md): a user's logged workouts — create + list only, no
/// update/delete. Both verbs resolve the caller's identity themselves via ICurrentUserProvider; it
/// is never a parameter here.
/// </summary>
public interface IWorkoutsUseCase
{
    /// <summary>The caller's own workouts, most recent first (mirrors the source backend's
    /// GET /workouts, which orders by timestamp desc).</summary>
    Task<Result<List<WorkoutDto>>> GetWorkoutsAsync();

    /// <summary>Logs a new workout for the caller and returns it. The timestamp is always
    /// server-set — the request never carries one.</summary>
    Task<Result<WorkoutDto>> LogWorkoutAsync(LogWorkoutRequestDto request);
}

public record WorkoutDto(
    Guid Id,
    string Type,
    double? Volume,
    int? Duration,
    DateTime Timestamp);

public record LogWorkoutRequestDto(
    string Type,
    double? Volume,
    int? Duration);

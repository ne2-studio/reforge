using Reforge.Core.Shared;

namespace Reforge.Core.Activities;

/// <summary>
/// Slice 4 (docs/plan/02-vertical-slices.md): a user's logged activities — create + list only, no
/// update/delete. Both verbs resolve the caller's identity themselves via ICurrentUserProvider; it
/// is never a parameter here.
/// </summary>
public interface IActivitiesUseCase
{
    /// <summary>The caller's own activities, most recent first (mirrors the source backend's
    /// GET /activities, which orders by timestamp desc).</summary>
    Task<Result<List<ActivityDto>>> GetActivitiesAsync();

    /// <summary>Logs a new activity for the caller and returns it. The timestamp is always
    /// server-set — the request never carries one.</summary>
    Task<Result<ActivityDto>> LogActivityAsync(LogActivityRequestDto request);
}

public record ActivityDto(
    Guid Id,
    string Type,
    int? Duration,
    int? Steps,
    DateTime Timestamp);

public record LogActivityRequestDto(
    string Type,
    int? Duration,
    int? Steps);

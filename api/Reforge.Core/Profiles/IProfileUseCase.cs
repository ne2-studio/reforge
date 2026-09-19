using Reforge.Core.Shared;

namespace Reforge.Core.Profiles;

/// <summary>
/// Slice 1 (docs/plan/02-vertical-slices.md): the authenticated caller's own profile — age,
/// body/activity stats, training preferences, dietary restrictions, calorie target, plus a free-
/// form extraData escape hatch. Both verbs resolve the caller's identity themselves via
/// ICurrentUserProvider; it is never a parameter here.
/// </summary>
public interface IProfileUseCase
{
    /// <summary>Fails with NotFound if the caller has never saved a profile yet — that's a normal
    /// state during onboarding, not a server error, but GET still has nothing to return.</summary>
    Task<Result<ProfileDto>> GetProfileAsync();

    /// <summary>Inserts or fully replaces the caller's profile and returns the saved result.</summary>
    Task<Result<ProfileDto>> SaveProfileAsync(SaveProfileRequestDto request);
}

public record ProfileDto(
    int? Age,
    string? Gender,
    double? Height,
    double? Weight,
    string? ActivityLevel,
    string? Goal,
    List<string> TrainingDays,
    string? TrainingType,
    string? TrainingTime,
    string? Restrictions,
    int? CalorieTarget,
    Dictionary<string, object?> ExtraData,
    DateTime UpdatedAt);

public record SaveProfileRequestDto(
    int? Age,
    string? Gender,
    double? Height,
    double? Weight,
    string? ActivityLevel,
    string? Goal,
    List<string>? TrainingDays,
    string? TrainingType,
    string? TrainingTime,
    string? Restrictions,
    int? CalorieTarget,
    Dictionary<string, object?>? ExtraData);

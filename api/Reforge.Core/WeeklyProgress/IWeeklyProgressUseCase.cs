using Reforge.Core.Shared;

namespace Reforge.Core.WeeklyProgress;

/// <summary>
/// Slice 7 (docs/plan/02-vertical-slices.md): the caller's last 7 days (today inclusive) of
/// target/consumed calories, deficit math, adherence streak and Spanish insight copy. Split out of
/// the former ClosedDays slice once "day close" was removed from the product — weekly progress
/// never depended on a ClosedDay row for anything but the now-removed per-day IsClosed flag. The
/// caller's identity is never a parameter here; GetWeeklyProgressAsync resolves it itself via
/// ICurrentUserProvider.
/// </summary>
public interface IWeeklyProgressUseCase
{
    /// <summary>The caller's last 7 days (today inclusive) of target/consumed calories, deficit
    /// math, adherence streak and Spanish insight copy.</summary>
    Task<Result<WeeklyProgressDto>> GetWeeklyProgressAsync();
}

public record WeeklyDayDto(
    DateOnly Date,
    int TargetCalories,
    int ConsumedCalories,
    int Deficit,
    int MealsCount);

public record WeeklyProgressDto(
    List<WeeklyDayDto> Days,
    int TotalDeficit,
    int DaysInDeficit,
    int DaysInSurplus,
    int DaysWithMeals,
    int AdherenceStreak,
    List<string> Insights);

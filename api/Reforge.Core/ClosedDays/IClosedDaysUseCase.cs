using Reforge.Core.Shared;

namespace Reforge.Core.ClosedDays;

/// <summary>
/// Slice 7 (docs/plan/02-vertical-slices.md): manually closing "today" (per IClock.UtcNow()) with
/// a deterministic, non-AI summary — a stand-in for the source backend's chat-driven
/// "cerrar mi día" command, deferred to a later slice (Slice 8) which can call CloseDayAsync
/// instead of duplicating this logic. All three verbs resolve the caller's identity themselves via
/// ICurrentUserProvider; it is never a parameter here.
/// </summary>
public interface IClosedDaysUseCase
{
    /// <summary>Closes today for the caller. Fails if no meals have been logged today, or if
    /// today has already been closed.</summary>
    Task<Result<ClosedDayDto>> CloseDayAsync();

    /// <summary>All of the caller's closed days, most recent first.</summary>
    Task<Result<List<ClosedDayDto>>> GetDayHistoryAsync();

    /// <summary>The caller's last 7 days (today inclusive) of target/consumed calories, deficit
    /// math, adherence streak and Spanish insight copy.</summary>
    Task<Result<WeeklyProgressDto>> GetWeeklyProgressAsync();
}

public record ClosedDayDto(
    DateOnly Date,
    DateTime ClosedAt,
    int TotalCalories,
    int MealsCount,
    bool IsTrainingDay,
    string Analysis);

public record WeeklyDayDto(
    DateOnly Date,
    int TargetCalories,
    int ConsumedCalories,
    int Deficit,
    int MealsCount,
    bool IsClosed);

public record WeeklyProgressDto(
    List<WeeklyDayDto> Days,
    int TotalDeficit,
    int DaysInDeficit,
    int DaysInSurplus,
    int DaysWithMeals,
    int AdherenceStreak,
    List<string> Insights);

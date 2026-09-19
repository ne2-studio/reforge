using Reforge.Core.Shared;

namespace Reforge.Core.Meals;

/// <summary>
/// Slice 2 (docs/plan/02-vertical-slices.md): manual meal logging — no AI analysis yet (see
/// SaveMealRequestDto's doc comment). Both verbs and the daily-stats query resolve the caller's
/// identity themselves via ICurrentUserProvider; it is never a parameter here.
/// </summary>
public interface IMealsUseCase
{
    /// <summary>The caller's own meals, most recent first (mirrors the source backend's
    /// GET /meals, which orders by timestamp desc).</summary>
    Task<Result<List<MealDto>>> GetMealsAsync();

    /// <summary>Saves a manually-entered meal for the caller and returns it.</summary>
    Task<Result<MealDto>> SaveMealAsync(SaveMealRequestDto request);

    /// <summary>Consumed-vs-target macro totals for the given calendar date. Fails with NotFound
    /// if the caller has no profile yet — targets can't be computed without one.</summary>
    Task<Result<DailyStatsDto>> GetDailyStatsAsync(DateOnly date);
}

public record MealDto(
    Guid Id,
    string MealText,
    string Category,
    string Time,
    int Calories,
    int Protein,
    int Carbs,
    int Fats,
    string? Feedback,
    Dictionary<string, object?> ExtraData,
    DateTime Timestamp,
    DateOnly Date);

// No manualAnalysis wrapper, unlike the source's /analyze-meal: that wrapper only existed to
// distinguish "AI produced this" from "user typed this", and there's no AI path in this slice at
// all yet — every meal saved here is manual, as a flat request.
public record SaveMealRequestDto(
    string MealText,
    string Category,
    string Time,
    int Calories,
    int Protein,
    int Carbs,
    int Fats,
    string? Feedback,
    Dictionary<string, object?>? ExtraData);

public record MacroValuesDto(int Calories, int Protein, int Carbs, int Fats);

public record DailyStatsDto(MacroValuesDto Consumed, MacroValuesDto Targets);

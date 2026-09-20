using Reforge.Core.Meals.Domain;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Subscriptions;
using Reforge.Core.Subscriptions.Domain;

namespace Reforge.Core.Meals.Application;

public class MealsManager(
    ICurrentUserProvider currentUserProvider,
    IMealRepository mealRepository,
    IProfileRepository profileRepository,
    IMealAnalysisBackend mealAnalysisBackend,
    IFeatureFlags featureFlags,
    ISubscriptionsUseCase subscriptionsUseCase,
    IClock clock,
    IIdGenerator idGenerator) : IMealsUseCase
{
    public async Task<Result<List<MealDto>>> GetMealsAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var meals = await mealRepository.GetByUserIdAsync(userId);
        return Result.Success(meals.Select(ToDto).ToList());
    }

    public async Task<Result<MealDto>> SaveMealAsync(SaveMealRequestDto request)
    {
        var userId = currentUserProvider.GetUserId();
        var now = clock.UtcNow();
        var meal = new Meal(
            idGenerator.NewId(),
            userId,
            request.MealText,
            request.Category,
            request.Time,
            request.Calories,
            request.Protein,
            request.Carbs,
            request.Fats,
            timestamp: now,
            date: DateOnly.FromDateTime(now),
            createdAt: now,
            feedback: request.Feedback,
            extraData: request.ExtraData);

        await mealRepository.AddAsync(meal);

        return Result.Success(ToDto(meal));
    }

    public async Task<Result<MealDto>> AnalyzeAndSaveMealAsync(AnalyzeMealRequestDto request)
    {
        var userId = currentUserProvider.GetUserId();

        // Slice 9: skip the usage-limit check entirely when the flag is off, rather than calling
        // a "always succeeds" no-op — today's unlimited behavior stays unchanged verbatim.
        if (featureFlags.SubscriptionsEnabled())
        {
            var limitCheck = await subscriptionsUseCase.CheckUsageLimitAsync(UsageAction.MealAnalysis);
            if (limitCheck.IsFailure)
                return Result.Failure<MealDto>(limitCheck.Error);
        }

        // Profile is optional context for the AI, same as recomp-coach-backend's
        // routes/meals.ts /analyze-meal handler — never fail here just because it's missing.
        var profile = await profileRepository.GetByUserIdAsync(userId);

        var analysisResult = await mealAnalysisBackend.AnalyzeAsync(request.MealText, request.Category, profile);
        if (analysisResult.IsFailure)
            return Result.Failure<MealDto>(analysisResult.Error);

        var analysis = analysisResult.Value;
        var now = clock.UtcNow();
        var meal = new Meal(
            idGenerator.NewId(),
            userId,
            request.MealText,
            request.Category,
            request.Time,
            analysis.Calories,
            analysis.Protein,
            analysis.Carbs,
            analysis.Fats,
            timestamp: now,
            date: DateOnly.FromDateTime(now),
            createdAt: now,
            feedback: analysis.Feedback);

        await mealRepository.AddAsync(meal);

        // Only after the meal actually succeeded and was persisted — never speculatively.
        if (featureFlags.SubscriptionsEnabled())
            await subscriptionsUseCase.RecordUsageAsync(UsageAction.MealAnalysis);

        return Result.Success(ToDto(meal));
    }

    public async Task<Result<DailyStatsDto>> GetDailyStatsAsync(DateOnly date)
    {
        var userId = currentUserProvider.GetUserId();
        var profile = await profileRepository.GetByUserIdAsync(userId);
        if (profile is null)
            return Result.Failure<DailyStatsDto>(ApplicationError.NotFound("User profile not found"));

        var dayMeals = await mealRepository.GetByUserIdAndDateAsync(userId, date);

        var consumed = new MacroValuesDto(
            dayMeals.Sum(m => m.Calories),
            dayMeals.Sum(m => m.Protein),
            dayMeals.Sum(m => m.Carbs),
            dayMeals.Sum(m => m.Fats));

        var targets = CalculateTargets(profile);

        return Result.Success(new DailyStatsDto(consumed, targets));
    }

    private static MacroValuesDto CalculateTargets(UserProfile profile)
    {
        var calorieTarget = CalorieTargetCalculator.Calculate(profile);
        var weight = profile.Weight is double w and not 0 ? w : 70;

        double proteinPerKg;
        double fatShareOfCalories;
        switch (profile.Goal)
        {
            case "lose-fat":
                proteinPerKg = 2.2;
                fatShareOfCalories = 0.25;
                break;
            case "gain-muscle":
                proteinPerKg = 2.0;
                fatShareOfCalories = 0.25;
                break;
            case "recomp":
                proteinPerKg = 2.0;
                fatShareOfCalories = 0.30;
                break;
            default:
                proteinPerKg = 1.8;
                fatShareOfCalories = 0.30;
                break;
        }

        var protein = (int)Math.Round(weight * proteinPerKg);
        var fats = (int)Math.Round(calorieTarget * fatShareOfCalories / 9);
        var carbs = (int)Math.Round((calorieTarget - (protein * 4) - (fats * 9)) / 4.0);

        return new MacroValuesDto(calorieTarget, protein, carbs, fats);
    }

    private static MealDto ToDto(Meal meal) => new(
        meal.Id,
        meal.MealText,
        meal.Category,
        meal.Time,
        meal.Calories,
        meal.Protein,
        meal.Carbs,
        meal.Fats,
        meal.Feedback,
        meal.ExtraData,
        meal.Timestamp,
        meal.Date);
}

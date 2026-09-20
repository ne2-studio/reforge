using Reforge.Core.ClosedDays.Domain;
using Reforge.Core.ClosedDays.OutputPorts;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Workouts.OutputPorts;

namespace Reforge.Core.ClosedDays.Application;

public class ClosedDaysManager(
    ICurrentUserProvider currentUserProvider,
    IClosedDayRepository closedDayRepository,
    IMealRepository mealRepository,
    IWorkoutRepository workoutRepository,
    IProfileRepository profileRepository,
    IClock clock,
    IIdGenerator idGenerator) : IClosedDaysUseCase
{
    public async Task<Result<ClosedDayDto>> CloseDayAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var today = DateOnly.FromDateTime(clock.UtcNow());

        var todaysMeals = await mealRepository.GetByUserIdAndDateAsync(userId, today);
        if (todaysMeals.Count == 0)
            return Result.Failure<ClosedDayDto>(ApplicationError.Validation("No meals logged today"));

        var existingDay = await closedDayRepository.GetByUserIdAndDateAsync(userId, today);
        if (existingDay is not null)
            return Result.Failure<ClosedDayDto>(ApplicationError.Validation("Day already closed"));

        var totalCalories = todaysMeals.Sum(m => m.Calories);
        var mealsCount = todaysMeals.Count;

        var workouts = await workoutRepository.GetByUserIdAsync(userId);
        var todaysWorkouts = workouts.Where(w => DateOnly.FromDateTime(w.Timestamp) == today).ToList();
        var isTrainingDay = todaysWorkouts.Count > 0;

        var profile = await profileRepository.GetByUserIdAsync(userId);
        var targetSuffix = profile is not null
            ? $" (objetivo: {CalorieTargetCalculator.Calculate(profile, todaysWorkouts)} cal)"
            : "";

        // Ports recomp-coach-backend's routes/chat.ts COMANDO_CERRAR_DIA fallback analysis
        // wording verbatim (a deterministic, non-AI summary — this repo doesn't have an AI coach
        // yet, see Slice 8).
        var analysis =
            $"Has registrado {mealsCount} comida{(mealsCount == 1 ? "" : "s")} con un total de {totalCalories} calorías{targetSuffix}.";

        var closedDay = new ClosedDay(
            idGenerator.NewId(),
            userId,
            today,
            closedAt: clock.UtcNow(),
            totalCalories: totalCalories,
            mealsCount: mealsCount,
            isTrainingDay: isTrainingDay,
            analysis: analysis);

        await closedDayRepository.AddAsync(closedDay);

        return Result.Success(ToDto(closedDay));
    }

    public async Task<Result<List<ClosedDayDto>>> GetDayHistoryAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var closedDays = await closedDayRepository.GetByUserIdAsync(userId);
        return Result.Success(closedDays.Select(ToDto).ToList());
    }

    // Ports recomp-coach-backend's routes/meals.ts /weekly-progress handler's business logic
    // (7-day window, deficit/surplus math, adherence-streak loop and Spanish insights copy)
    // verbatim in spirit, translating variable names to English but keeping every Spanish string
    // literal as-is (UI copy, not a domain term). The source's per-day hasCoachAnalysis field is
    // renamed IsClosed here — there's no AI coach in this slice, it's just "does a ClosedDay row
    // exist for this date".
    public async Task<Result<WeeklyProgressDto>> GetWeeklyProgressAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var profile = await profileRepository.GetByUserIdAsync(userId);
        var targetCalories = profile is not null ? CalorieTargetCalculator.Calculate(profile, []) : 2000;

        var allMeals = await mealRepository.GetByUserIdAsync(userId);
        var closedDays = await closedDayRepository.GetByUserIdAsync(userId);
        var closedDates = closedDays.Select(d => d.Date).ToHashSet();

        var today = DateOnly.FromDateTime(clock.UtcNow());

        var days = new List<WeeklyDayDto>();
        for (var i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);

            var dayMeals = allMeals.Where(m => m.Date == date).ToList();
            var consumedCalories = dayMeals.Sum(m => m.Calories);

            days.Add(new WeeklyDayDto(
                Date: date,
                TargetCalories: targetCalories,
                ConsumedCalories: consumedCalories,
                Deficit: consumedCalories - targetCalories,
                MealsCount: dayMeals.Count,
                IsClosed: closedDates.Contains(date)));
        }

        var daysWithMeals = days.Where(d => d.MealsCount > 0).ToList();
        var totalDeficit = daysWithMeals.Sum(d => d.Deficit);
        var daysInDeficit = daysWithMeals.Count(d => d.Deficit < 0);
        var daysInSurplus = daysWithMeals.Count(d => d.Deficit > 0);

        var adherenceStreak = 0;
        for (var i = days.Count - 1; i >= 0; i--)
        {
            if (days[i].Deficit < 0 && days[i].MealsCount > 0)
                adherenceStreak++;
            else if (days[i].MealsCount > 0)
                break;
        }

        var insights = new List<string>();
        var daysWithMealsCount = daysWithMeals.Count;

        if (daysWithMealsCount == 0)
        {
            insights.Add("Registra tus comidas y cierra el día para ver tu progreso semanal");
            return Result.Success(new WeeklyProgressDto(
                days, totalDeficit, daysInDeficit, daysInSurplus, daysWithMealsCount, adherenceStreak, insights));
        }

        if (totalDeficit < 0)
        {
            var avgDaily = (int)Math.Round(Math.Abs((double)totalDeficit) / daysWithMealsCount);
            insights.Add($"Vas bien: déficit promedio de {avgDaily} kcal/día esta semana");
        }
        else if (totalDeficit > 0)
        {
            var avgDaily = (int)Math.Round((double)totalDeficit / daysWithMealsCount);
            insights.Add($"Atención: superávit promedio de {avgDaily} kcal/día esta semana");
        }

        if (daysInDeficit >= 5)
            insights.Add($"{daysInDeficit} de {daysWithMealsCount} días en déficit. ¡Excelente adherencia!");
        else if (daysInDeficit >= 3)
            insights.Add($"{daysInDeficit} de {daysWithMealsCount} días en déficit. Vas por buen camino");
        else if (daysInSurplus > daysInDeficit)
            insights.Add($"{daysInSurplus} de {daysWithMealsCount} días en superávit. Ajusta tus porciones para mejorar");

        if (adherenceStreak >= 5)
            insights.Add($"¡Impresionante! Llevas {adherenceStreak} días consecutivos en déficit");
        else if (adherenceStreak >= 3)
            insights.Add($"¡Muy bien! Mantén la racha de {adherenceStreak} días en déficit");
        else if (adherenceStreak == 0 && daysInDeficit > 0)
            insights.Add("Intenta mantener varios días seguidos en déficit para mejores resultados");

        if (daysInSurplus >= 2)
        {
            string[] dayNames =
                ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
            var surplusByDayOfWeek = new Dictionary<int, int>();

            foreach (var day in days)
            {
                if (day.MealsCount > 0 && day.Deficit > 0)
                {
                    var dayOfWeek = (int)day.Date.DayOfWeek;
                    surplusByDayOfWeek[dayOfWeek] = surplusByDayOfWeek.GetValueOrDefault(dayOfWeek) + 1;
                }
            }

            var patterns = surplusByDayOfWeek
                .Where(kv => kv.Value >= 2)
                .Select(kv => dayNames[kv.Key])
                .ToList();

            if (patterns.Count > 0)
                insights.Add($"Los {string.Join(" y ", patterns)} tiendes a estar en superávit");
        }

        return Result.Success(new WeeklyProgressDto(
            days, totalDeficit, daysInDeficit, daysInSurplus, daysWithMealsCount, adherenceStreak, insights));
    }

    private static ClosedDayDto ToDto(ClosedDay closedDay) => new(
        closedDay.Date,
        closedDay.ClosedAt,
        closedDay.TotalCalories,
        closedDay.MealsCount,
        closedDay.IsTrainingDay,
        closedDay.Analysis);
}

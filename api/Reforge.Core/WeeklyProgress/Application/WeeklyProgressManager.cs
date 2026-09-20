using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.WeeklyProgress.Application;

public class WeeklyProgressManager(
    ICurrentUserProvider currentUserProvider,
    IMealRepository mealRepository,
    IProfileRepository profileRepository,
    IClock clock) : IWeeklyProgressUseCase
{
    // Ports recomp-coach-backend's routes/meals.ts /weekly-progress handler's business logic
    // (7-day window, deficit/surplus math, adherence-streak loop and Spanish insights copy)
    // verbatim in spirit, translating variable names to English but keeping every Spanish string
    // literal as-is (UI copy, not a domain term). Split out of the former ClosedDaysManager once
    // "day close" was removed from the product — this never depended on anything but meals/profile.
    public async Task<Result<WeeklyProgressDto>> GetWeeklyProgressAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var profile = await profileRepository.GetByUserIdAsync(userId);
        var targetCalories = profile is not null ? CalorieTargetCalculator.Calculate(profile, [], []) : 2000;

        var allMeals = await mealRepository.GetByUserIdAsync(userId);

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
                MealsCount: dayMeals.Count));
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
            insights.Add("Registra tus comidas para ver tu progreso semanal");
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
}

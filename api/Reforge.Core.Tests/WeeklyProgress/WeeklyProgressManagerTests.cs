using Reforge.Domain;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Tests.Fakes;
using Reforge.Core.WeeklyProgress.Application;

namespace Reforge.Core.Tests.WeeklyProgress;

public class WeeklyProgressManagerTests
{
    private static readonly UserId UserId = new("auth0|weekly-progress-user");

    [Fact]
    public async Task GetWeeklyProgressAsync_ComputesTheSevenDayWindow_DeficitSurplusMath_AdherenceStreak_AndInsights()
    {
        var mealRepository = new FakeMealRepository();
        var profileRepository = new FakeProfileRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc); // Tuesday
        var todayDate = DateOnly.FromDateTime(today);

        profileRepository.Seed(new UserProfile(UserId, updatedAt: today, calorieTarget: 2000));

        // 6 days ago: no meals at all.
        // 5 days ago (2026-03-05): 1800 kcal -> deficit.
        mealRepository.Seed(NewMeal(calories: 1800, date: todayDate.AddDays(-5)));
        // 4 days ago: 1900 kcal -> deficit.
        mealRepository.Seed(NewMeal(calories: 1900, date: todayDate.AddDays(-4)));
        // 3 days ago: 1950 kcal -> deficit.
        mealRepository.Seed(NewMeal(calories: 1950, date: todayDate.AddDays(-3)));
        // 2 days ago: 2500 kcal -> surplus, breaks the streak.
        mealRepository.Seed(NewMeal(calories: 2500, date: todayDate.AddDays(-2)));
        // Yesterday: no meals.
        // Today: 1700 kcal -> deficit.
        mealRepository.Seed(NewMeal(calories: 1700, date: todayDate));

        var manager = new WeeklyProgressManager(
            new FakeCurrentUserProvider(UserId),
            mealRepository,
            profileRepository,
            new FakeClock(today));

        var result = await manager.GetWeeklyProgressAsync();

        Assert.True(result.IsSuccess);
        var progress = result.Value;
        Assert.Equal(7, progress.Days.Count);
        Assert.Equal(todayDate.AddDays(-6), progress.Days[0].Date);
        Assert.Equal(todayDate, progress.Days[6].Date);

        Assert.Equal(5, progress.DaysWithMeals);
        Assert.Equal(4, progress.DaysInDeficit);
        Assert.Equal(1, progress.DaysInSurplus);
        // Adherence streak counts consecutive deficit days working backward from today; today
        // itself is a deficit day (1700 < 2000), so the streak is just 1.
        Assert.Equal(1, progress.AdherenceStreak);

        var expectedTotalDeficit = (1800 - 2000) + (1900 - 2000) + (1950 - 2000) + (2500 - 2000) + (1700 - 2000);
        Assert.Equal(expectedTotalDeficit, progress.TotalDeficit);
        Assert.NotEmpty(progress.Insights);
    }

    [Fact]
    public async Task GetWeeklyProgressAsync_WhenCalorieTargetIsUnset_ComputesItFromTheMifflinStJeorFormula()
    {
        var mealRepository = new FakeMealRepository();
        var profileRepository = new FakeProfileRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);

        profileRepository.Seed(new UserProfile(
            UserId, updatedAt: today,
            age: 30, gender: "male", height: 180, weight: 80, activityLevel: "moderate", goal: "maintain"));

        var manager = new WeeklyProgressManager(
            new FakeCurrentUserProvider(UserId),
            mealRepository,
            profileRepository,
            new FakeClock(today));

        var result = await manager.GetWeeklyProgressAsync();

        Assert.True(result.IsSuccess);
        // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780; TDEE = 1780 * 1.55 (moderate) = 2759; no
        // goal adjustment for "maintain" — same formula as MealsManager.CalculateTargets.
        Assert.All(result.Value.Days, day => Assert.Equal(2759, day.TargetCalories));
    }

    private static Meal NewMeal(int calories, DateOnly date) => new(
        Guid.NewGuid(),
        UserId,
        mealText: "meal",
        category: "lunch",
        time: "12:00",
        calories: calories,
        protein: 0,
        carbs: 0,
        fats: 0,
        timestamp: date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
        date: date,
        createdAt: date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
}

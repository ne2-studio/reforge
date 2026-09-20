using Reforge.Domain;
using Reforge.Core.ClosedDays;
using Reforge.Core.ClosedDays.Application;
using Reforge.Core.ClosedDays.Domain;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Tests.Fakes;
using Reforge.Core.Workouts.Domain;

namespace Reforge.Core.Tests.ClosedDays;

public class ClosedDaysManagerTests
{
    private static readonly UserId UserId = new("auth0|closed-days-user");

    [Fact]
    public async Task CloseDayAsync_ClosesToday_WithProfileTargetAndSameDayWorkout()
    {
        var mealRepository = new FakeMealRepository();
        var workoutRepository = new FakeWorkoutRepository();
        var profileRepository = new FakeProfileRepository();
        var closedDayRepository = new FakeClosedDayRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);

        mealRepository.Seed(NewMeal(calories: 500, date: DateOnly.FromDateTime(today)));
        mealRepository.Seed(NewMeal(calories: 300, date: DateOnly.FromDateTime(today)));
        workoutRepository.Seed(new Workout(Guid.NewGuid(), UserId, "strength", timestamp: today));
        profileRepository.Seed(new UserProfile(UserId, updatedAt: today, calorieTarget: 2200));

        var manager = new ClosedDaysManager(
            new FakeCurrentUserProvider(UserId),
            closedDayRepository,
            mealRepository,
            workoutRepository,
            profileRepository,
            new FakeClock(today),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.CloseDayAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(DateOnly.FromDateTime(today), result.Value.Date);
        Assert.Equal(800, result.Value.TotalCalories);
        Assert.Equal(2, result.Value.MealsCount);
        Assert.True(result.Value.IsTrainingDay);
        Assert.Equal("Has registrado 2 comidas con un total de 800 calorías (objetivo: 2200 cal).", result.Value.Analysis);
    }

    [Fact]
    public async Task CloseDayAsync_ClosesToday_WithoutAProfile_OmitsTargetSuffix_AndIsNotATrainingDay()
    {
        var mealRepository = new FakeMealRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);
        mealRepository.Seed(NewMeal(calories: 600, date: DateOnly.FromDateTime(today)));

        var manager = new ClosedDaysManager(
            new FakeCurrentUserProvider(UserId),
            new FakeClosedDayRepository(),
            mealRepository,
            new FakeWorkoutRepository(),
            new FakeProfileRepository(),
            new FakeClock(today),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.CloseDayAsync();

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.IsTrainingDay);
        Assert.Equal("Has registrado 1 comida con un total de 600 calorías.", result.Value.Analysis);
    }

    [Fact]
    public async Task CloseDayAsync_FailsValidation_WhenNoMealsLoggedToday()
    {
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);

        var manager = new ClosedDaysManager(
            new FakeCurrentUserProvider(UserId),
            new FakeClosedDayRepository(),
            new FakeMealRepository(),
            new FakeWorkoutRepository(),
            new FakeProfileRepository(),
            new FakeClock(today),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.CloseDayAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Validation, result.Error.Code);
    }

    [Fact]
    public async Task CloseDayAsync_FailsValidation_WhenTodayIsAlreadyClosed()
    {
        var mealRepository = new FakeMealRepository();
        var closedDayRepository = new FakeClosedDayRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);
        var todayDate = DateOnly.FromDateTime(today);
        mealRepository.Seed(NewMeal(calories: 500, date: todayDate));
        closedDayRepository.Seed(new ClosedDay(
            Guid.NewGuid(), UserId, todayDate, closedAt: today, totalCalories: 500, mealsCount: 1,
            isTrainingDay: false, analysis: "already closed"));

        var manager = new ClosedDaysManager(
            new FakeCurrentUserProvider(UserId),
            closedDayRepository,
            mealRepository,
            new FakeWorkoutRepository(),
            new FakeProfileRepository(),
            new FakeClock(today),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.CloseDayAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Validation, result.Error.Code);
    }

    [Fact]
    public async Task GetDayHistoryAsync_ReturnsTheCallersOwnClosedDays_MostRecentFirst()
    {
        var closedDayRepository = new FakeClosedDayRepository();
        var otherUserId = new UserId("auth0|someone-else");
        var older = NewClosedDay(new DateOnly(2026, 3, 1));
        var newer = NewClosedDay(new DateOnly(2026, 3, 5));
        var theirs = NewClosedDay(new DateOnly(2026, 3, 10), userId: otherUserId);
        closedDayRepository.Seed(older);
        closedDayRepository.Seed(newer);
        closedDayRepository.Seed(theirs);

        var manager = new ClosedDaysManager(
            new FakeCurrentUserProvider(UserId),
            closedDayRepository,
            new FakeMealRepository(),
            new FakeWorkoutRepository(),
            new FakeProfileRepository(),
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetDayHistoryAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal(newer.Date, result.Value[0].Date);
        Assert.Equal(older.Date, result.Value[1].Date);
    }

    [Fact]
    public async Task GetWeeklyProgressAsync_ComputesTheSevenDayWindow_DeficitSurplusMath_AdherenceStreak_IsClosed_AndInsights()
    {
        var mealRepository = new FakeMealRepository();
        var profileRepository = new FakeProfileRepository();
        var closedDayRepository = new FakeClosedDayRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc); // Tuesday
        var todayDate = DateOnly.FromDateTime(today);

        profileRepository.Seed(new UserProfile(UserId, updatedAt: today, calorieTarget: 2000));

        // 6 days ago: no meals at all.
        // 5 days ago (2026-03-05): 1800 kcal -> deficit, closed.
        mealRepository.Seed(NewMeal(calories: 1800, date: todayDate.AddDays(-5)));
        closedDayRepository.Seed(NewClosedDay(todayDate.AddDays(-5)));
        // 4 days ago: 1900 kcal -> deficit.
        mealRepository.Seed(NewMeal(calories: 1900, date: todayDate.AddDays(-4)));
        // 3 days ago: 1950 kcal -> deficit.
        mealRepository.Seed(NewMeal(calories: 1950, date: todayDate.AddDays(-3)));
        // 2 days ago: 2500 kcal -> surplus, breaks the streak.
        mealRepository.Seed(NewMeal(calories: 2500, date: todayDate.AddDays(-2)));
        // Yesterday: no meals.
        // Today: 1700 kcal -> deficit.
        mealRepository.Seed(NewMeal(calories: 1700, date: todayDate));

        var manager = new ClosedDaysManager(
            new FakeCurrentUserProvider(UserId),
            closedDayRepository,
            mealRepository,
            new FakeWorkoutRepository(),
            profileRepository,
            new FakeClock(today),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetWeeklyProgressAsync();

        Assert.True(result.IsSuccess);
        var progress = result.Value;
        Assert.Equal(7, progress.Days.Count);
        Assert.Equal(todayDate.AddDays(-6), progress.Days[0].Date);
        Assert.Equal(todayDate, progress.Days[6].Date);

        var closedDay = progress.Days.Single(d => d.Date == todayDate.AddDays(-5));
        Assert.True(closedDay.IsClosed);
        Assert.False(progress.Days.Single(d => d.Date == todayDate.AddDays(-4)).IsClosed);

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
        var closedDayRepository = new FakeClosedDayRepository();
        var today = new DateTime(2026, 3, 10, 9, 0, 0, DateTimeKind.Utc);

        profileRepository.Seed(new UserProfile(
            UserId, updatedAt: today,
            age: 30, gender: "male", height: 180, weight: 80, activityLevel: "moderate", goal: "maintain"));

        var manager = new ClosedDaysManager(
            new FakeCurrentUserProvider(UserId),
            closedDayRepository,
            mealRepository,
            new FakeWorkoutRepository(),
            profileRepository,
            new FakeClock(today),
            new FakeIdGenerator(Guid.NewGuid()));

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

    private static ClosedDay NewClosedDay(DateOnly date, UserId? userId = null) => new(
        Guid.NewGuid(),
        userId ?? UserId,
        date,
        closedAt: date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
        totalCalories: 1800,
        mealsCount: 1,
        isTrainingDay: false,
        analysis: "analysis");
}

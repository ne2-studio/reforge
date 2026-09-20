using Reforge.Domain;
using Reforge.Core.Meals;
using Reforge.Core.Meals.Application;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Tests.Fakes;
using Reforge.Infra.Lite;

namespace Reforge.Core.Tests.Meals;

public class MealsManagerTests
{
    private static readonly UserId UserId = new("auth0|meals-user");

    [Fact]
    public async Task GetMealsAsync_ReturnsTheCallersOwnMeals_MostRecentFirst()
    {
        var repository = new FakeMealRepository();
        var otherUsersMeal = NewMeal(userId: new UserId("someone-else"), timestamp: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));
        var older = NewMeal(timestamp: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewMeal(timestamp: new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc));
        repository.Seed(otherUsersMeal);
        repository.Seed(older);
        repository.Seed(newer);

        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeProfileRepository(),
            new FakeMealAnalysisBackend(),
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetMealsAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal(newer.Id, result.Value[0].Id);
        Assert.Equal(older.Id, result.Value[1].Id);
    }

    [Fact]
    public async Task SaveMealAsync_SavesUnderTheCallersUserId_AndReturnsTheSavedMeal()
    {
        var repository = new FakeMealRepository();
        var now = new DateTime(2026, 3, 4, 12, 30, 0, DateTimeKind.Utc);
        var id = Guid.NewGuid();

        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeProfileRepository(),
            new FakeMealAnalysisBackend(),
            new FakeClock(now),
            new FakeIdGenerator(id));

        var request = new SaveMealRequestDto(
            MealText: "Chicken and rice",
            Category: "lunch",
            Time: "13:00",
            Calories: 600,
            Protein: 50,
            Carbs: 60,
            Fats: 15,
            Feedback: "Great choice",
            ExtraData: new Dictionary<string, object?> { ["source"] = "manual" });

        var result = await manager.SaveMealAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(id, result.Value.Id);
        Assert.Equal("Chicken and rice", result.Value.MealText);
        Assert.Equal(DateOnly.FromDateTime(now), result.Value.Date);
        Assert.Equal(now, result.Value.Timestamp);
        Assert.Equal("manual", result.Value.ExtraData["source"]);

        var stored = await repository.GetByUserIdAsync(UserId);
        Assert.Single(stored);
        Assert.Equal(UserId, stored[0].UserId);
    }

    [Fact]
    public async Task GetDailyStatsAsync_WhenCallerHasNoProfile_ReturnsNotFound()
    {
        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            new FakeMealRepository(),
            new FakeProfileRepository(),
            new FakeMealAnalysisBackend(),
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetDailyStatsAsync(new DateOnly(2026, 3, 4));

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
    }

    [Fact]
    public async Task GetDailyStatsAsync_SumsOnlyTheRequestedDatesMeals()
    {
        var date = new DateOnly(2026, 3, 4);
        var mealRepository = new FakeMealRepository();
        mealRepository.Seed(NewMeal(date: date, calories: 500, protein: 40, carbs: 50, fats: 10));
        mealRepository.Seed(NewMeal(date: date, calories: 300, protein: 20, carbs: 30, fats: 5));
        mealRepository.Seed(NewMeal(date: date.AddDays(-1), calories: 999, protein: 99, carbs: 99, fats: 99));

        var profileRepository = new FakeProfileRepository();
        profileRepository.Seed(new UserProfile(UserId, DateTime.UtcNow, weight: 70, goal: "recomp", calorieTarget: 2200));

        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            mealRepository,
            profileRepository,
            new FakeMealAnalysisBackend(),
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetDailyStatsAsync(date);

        Assert.True(result.IsSuccess);
        Assert.Equal(800, result.Value.Consumed.Calories);
        Assert.Equal(60, result.Value.Consumed.Protein);
        Assert.Equal(80, result.Value.Consumed.Carbs);
        Assert.Equal(15, result.Value.Consumed.Fats);
    }

    [Theory]
    [InlineData("lose-fat", 80, 2000, 176, 198, 56)]
    [InlineData("gain-muscle", 75, 2500, 150, 320, 69)]
    [InlineData("recomp", 70, 2200, 140, 246, 73)]
    [InlineData("some-unrecognized-or-unset-goal", 70, 2000, 126, 223, 67)]
    public async Task GetDailyStatsAsync_ComputesMacroTargetsFromTheProfilesGoal(
        string? goal, double weight, int calorieTarget, int expectedProtein, int expectedCarbs, int expectedFats)
    {
        var profileRepository = new FakeProfileRepository();
        profileRepository.Seed(new UserProfile(UserId, DateTime.UtcNow, weight: weight, goal: goal, calorieTarget: calorieTarget));

        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            new FakeMealRepository(),
            profileRepository,
            new FakeMealAnalysisBackend(),
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetDailyStatsAsync(new DateOnly(2026, 3, 4));

        Assert.True(result.IsSuccess);
        Assert.Equal(calorieTarget, result.Value.Targets.Calories);
        Assert.Equal(expectedProtein, result.Value.Targets.Protein);
        Assert.Equal(expectedCarbs, result.Value.Targets.Carbs);
        Assert.Equal(expectedFats, result.Value.Targets.Fats);
    }

    [Fact]
    public async Task GetDailyStatsAsync_WhenWeightAndCalorieTargetAreUnset_FallsBackToSourceDefaults()
    {
        var profileRepository = new FakeProfileRepository();
        profileRepository.Seed(new UserProfile(UserId, DateTime.UtcNow));

        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            new FakeMealRepository(),
            profileRepository,
            new FakeMealAnalysisBackend(),
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetDailyStatsAsync(new DateOnly(2026, 3, 4));

        Assert.True(result.IsSuccess);
        // Mirrors the source's `Number(profile.calorieTarget) || 2000`/`Number(profile.weight) ||
        // 70` fallback — unset weight/calorieTarget default to 70/2000.
        Assert.Equal(2000, result.Value.Targets.Calories);
        Assert.Equal(126, result.Value.Targets.Protein);
        Assert.Equal(223, result.Value.Targets.Carbs);
        Assert.Equal(67, result.Value.Targets.Fats);
    }

    [Fact]
    public async Task AnalyzeAndSaveMealAsync_AnalyzesViaTheBackend_AndSavesTheResultingMeal()
    {
        var mealRepository = new FakeMealRepository();
        var analysisBackend = new FakeMealAnalysisBackend
        {
            NextAnalysis = Result.Success(new MealAnalysisDto(Calories: 620, Protein: 45, Carbs: 55, Fats: 18, Feedback: "Buen balance de macros"))
        };
        var now = new DateTime(2026, 3, 4, 12, 30, 0, DateTimeKind.Utc);
        var id = Guid.NewGuid();

        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            mealRepository,
            new FakeProfileRepository(),
            analysisBackend,
            new FakeClock(now),
            new FakeIdGenerator(id));

        var request = new AnalyzeMealRequestDto(MealText: "Chicken and rice", Category: "lunch", Time: "13:00");

        var result = await manager.AnalyzeAndSaveMealAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(id, result.Value.Id);
        Assert.Equal(620, result.Value.Calories);
        Assert.Equal(45, result.Value.Protein);
        Assert.Equal(55, result.Value.Carbs);
        Assert.Equal(18, result.Value.Fats);
        Assert.Equal("Buen balance de macros", result.Value.Feedback);
        Assert.Equal(DateOnly.FromDateTime(now), result.Value.Date);

        var stored = await mealRepository.GetByUserIdAsync(UserId);
        Assert.Single(stored);
        Assert.Equal("Chicken and rice", stored[0].MealText);

        var call = Assert.Single(analysisBackend.Calls);
        Assert.Equal("Chicken and rice", call.MealText);
        Assert.Equal("lunch", call.Category);
        Assert.Null(call.Profile);
    }

    [Fact]
    public async Task AnalyzeAndSaveMealAsync_PassesTheCallersProfileAsContext_WhenOneExists()
    {
        var profileRepository = new FakeProfileRepository();
        var profile = new UserProfile(UserId, DateTime.UtcNow, weight: 70, goal: "recomp");
        profileRepository.Seed(profile);
        var analysisBackend = new FakeMealAnalysisBackend();

        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            new FakeMealRepository(),
            profileRepository,
            analysisBackend,
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        await manager.AnalyzeAndSaveMealAsync(new AnalyzeMealRequestDto("Chicken and rice", "lunch", "13:00"));

        var call = Assert.Single(analysisBackend.Calls);
        Assert.Equal(profile, call.Profile);
    }

    [Fact]
    public async Task AnalyzeAndSaveMealAsync_PropagatesTheBackendsFailure_AndSavesNothing()
    {
        var mealRepository = new FakeMealRepository();
        var analysisBackend = new FakeMealAnalysisBackend
        {
            NextAnalysis = Result.Failure<MealAnalysisDto>(ApplicationError.ExternalDependencyUnavailable("Meal analysis is not configured."))
        };

        var manager = new MealsManager(
            new FakeCurrentUserProvider(UserId),
            mealRepository,
            new FakeProfileRepository(),
            analysisBackend,
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.AnalyzeAndSaveMealAsync(new AnalyzeMealRequestDto("Chicken and rice", "lunch", "13:00"));

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.ExternalDependencyUnavailable, result.Error.Code);
        Assert.Empty(await mealRepository.GetByUserIdAsync(UserId));
    }

    private static Meal NewMeal(
        UserId? userId = null,
        DateTime? timestamp = null,
        DateOnly? date = null,
        int calories = 500,
        int protein = 30,
        int carbs = 40,
        int fats = 10) => new(
            Guid.NewGuid(),
            userId ?? UserId,
            "Test meal",
            "lunch",
            "13:00",
            calories,
            protein,
            carbs,
            fats,
            timestamp: timestamp ?? DateTime.UtcNow,
            date: date ?? DateOnly.FromDateTime(timestamp ?? DateTime.UtcNow),
            createdAt: DateTime.UtcNow);
}

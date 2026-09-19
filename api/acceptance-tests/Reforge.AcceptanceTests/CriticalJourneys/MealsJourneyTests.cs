using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Slice 2 (docs/plan/02-vertical-slices.md): manual meal logging. One full journey — log in via
/// fake-oidc, save a profile (daily-stats needs one to compute targets), POST a meal, GET meals
/// back, then GET daily-stats for that meal's date — mirrors ProfileJourneyTests' scope and
/// reasoning. Reforge.Core.Tests/Reforge.Infra.PersistenceTests already cover
/// MealsManager/MealRepository far more cheaply; this only proves the image's public wire
/// contract (OIDC auth, EF Core + migrations, the jsonb ExtraData column, the cross-feature
/// profile lookup) works end to end.
///
/// Request/response bodies are built/asserted via anonymous objects and JsonDocument, never by
/// referencing Reforge.Core's DTOs — see ../README.md's "no shared fixtures, no reused internal
/// DTOs" rule.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class MealsJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task PostThenGetMeal_with_a_real_fake_oidc_token_persists_the_meal_and_feeds_daily_stats()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postProfileRequest = new HttpRequestMessage(HttpMethod.Post, "/api/profile")
        {
            Content = JsonContent.Create(new
            {
                weight = 70.0,
                goal = "recomp",
                calorieTarget = 2200
            })
        };
        postProfileRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postProfileResponse = await fixture.BackendClient.SendAsync(postProfileRequest);
        postProfileResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var mealDate = DateOnly.FromDateTime(DateTime.UtcNow);

        using var postMealRequest = new HttpRequestMessage(HttpMethod.Post, "/api/meals")
        {
            Content = JsonContent.Create(new
            {
                mealText = "Chicken and rice",
                category = "lunch",
                time = "13:00",
                calories = 600,
                protein = 50,
                carbs = 60,
                fats = 15,
                feedback = "Great choice",
                extraData = new { source = "manual" }
            })
        };
        postMealRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postMealResponse = await fixture.BackendClient.SendAsync(postMealRequest);
        postMealResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getMealsRequest = new HttpRequestMessage(HttpMethod.Get, "/api/meals");
        getMealsRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getMealsResponse = await fixture.BackendClient.SendAsync(getMealsRequest);
        getMealsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var mealsBody = await getMealsResponse.Content.ReadAsStringAsync();
        using var mealsJson = JsonDocument.Parse(mealsBody);
        var meals = mealsJson.RootElement.EnumerateArray().ToList();
        meals.Should().ContainSingle();
        meals[0].GetProperty("mealText").GetString().Should().Be("Chicken and rice");
        meals[0].GetProperty("calories").GetInt32().Should().Be(600);
        meals[0].GetProperty("extraData").GetProperty("source").GetString().Should().Be("manual");

        using var getDailyStatsRequest = new HttpRequestMessage(
            HttpMethod.Get, $"/api/daily-stats/{mealDate:yyyy-MM-dd}");
        getDailyStatsRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getDailyStatsResponse = await fixture.BackendClient.SendAsync(getDailyStatsRequest);
        getDailyStatsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var dailyStatsBody = await getDailyStatsResponse.Content.ReadAsStringAsync();
        using var dailyStatsJson = JsonDocument.Parse(dailyStatsBody);
        var consumed = dailyStatsJson.RootElement.GetProperty("consumed");
        consumed.GetProperty("calories").GetInt32().Should().Be(600);
        consumed.GetProperty("protein").GetInt32().Should().Be(50);
        consumed.GetProperty("carbs").GetInt32().Should().Be(60);
        consumed.GetProperty("fats").GetInt32().Should().Be(15);

        var targets = dailyStatsJson.RootElement.GetProperty("targets");
        // recomp goal, weight 70, calorieTarget 2200: protein = 70*2.0 = 140.
        targets.GetProperty("calories").GetInt32().Should().Be(2200);
        targets.GetProperty("protein").GetInt32().Should().Be(140);
    }

    [Fact]
    public async Task GetDailyStats_for_a_user_with_no_saved_profile_returns_404()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcSecondUserKey);

        using var request = new HttpRequestMessage(
            HttpMethod.Get, $"/api/daily-stats/{DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await fixture.BackendClient.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetMeals_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/meals");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

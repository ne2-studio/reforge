using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Slice 7 (docs/plan/02-vertical-slices.md): the weekly-progress view (7-day window,
/// target/consumed calories, deficit math). One full journey — log in via fake-oidc, POST a meal,
/// then confirm it's reflected by GET /weekly-progress — mirrors MeasurementsJourneyTests' scope
/// and reasoning. Split out of the former ClosedDaysJourneyTests once "day close" was removed from
/// the product. Reforge.Core.Tests/Reforge.Infra.PersistenceTests already cover
/// WeeklyProgressManager far more cheaply; this only proves the image's public wire contract (OIDC
/// auth, EF Core + migrations, the cross-feature meal lookups) works end to end.
///
/// Request/response bodies are built/asserted via anonymous objects and JsonDocument, never by
/// referencing Reforge.Core's DTOs — see ../README.md's "no shared fixtures, no reused internal
/// DTOs" rule.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class WeeklyProgressJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task PostMeal_then_weekly_progress_reflects_todays_consumed_calories_and_meals_count()
    {
        // Uses OidcSecondUserKey (not OidcUserKey) to avoid colliding with MealsJourneyTests'
        // own meal posted for OidcUserKey on the same date, since acceptance tests share one
        // database across the whole run (see ../README.md).
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcSecondUserKey);

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
                fats = 15
            })
        };
        postMealRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postMealResponse = await fixture.BackendClient.SendAsync(postMealRequest);
        postMealResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");

        using var getWeeklyProgressRequest = new HttpRequestMessage(HttpMethod.Get, "/api/weekly-progress");
        getWeeklyProgressRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getWeeklyProgressResponse = await fixture.BackendClient.SendAsync(getWeeklyProgressRequest);
        getWeeklyProgressResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var weeklyProgressBody = await getWeeklyProgressResponse.Content.ReadAsStringAsync();
        using var weeklyProgressJson = JsonDocument.Parse(weeklyProgressBody);
        var weeklyDays = weeklyProgressJson.RootElement.GetProperty("days").EnumerateArray().ToList();
        weeklyDays.Should().HaveCount(7);
        var todayEntry = weeklyDays.Single(d => d.GetProperty("date").GetString() == today);
        todayEntry.GetProperty("consumedCalories").GetInt32().Should().Be(600);
        todayEntry.GetProperty("mealsCount").GetInt32().Should().Be(1);
        todayEntry.TryGetProperty("isClosed", out _).Should().BeFalse();
    }

    [Fact]
    public async Task GetWeeklyProgress_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/weekly-progress");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

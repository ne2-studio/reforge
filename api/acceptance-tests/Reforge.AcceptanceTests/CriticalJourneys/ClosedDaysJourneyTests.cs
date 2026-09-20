using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Slice 7 (docs/plan/02-vertical-slices.md): manually closing "today" with a deterministic
/// summary. One full journey — log in via fake-oidc, POST a meal, POST /close-day, then confirm
/// the result shows up in GET /day-history and is reflected by GET /weekly-progress — mirrors
/// MeasurementsJourneyTests' scope and reasoning. Reforge.Core.Tests/
/// Reforge.Infra.PersistenceTests already cover ClosedDaysManager/ClosedDayRepository far more
/// cheaply; this only proves the image's public wire contract (OIDC auth, EF Core + migrations,
/// the cross-feature meal/workout lookups) works end to end.
///
/// Request/response bodies are built/asserted via anonymous objects and JsonDocument, never by
/// referencing Reforge.Core's DTOs — see ../README.md's "no shared fixtures, no reused internal
/// DTOs" rule.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class ClosedDaysJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task CloseDay_after_logging_a_meal_shows_up_in_day_history_and_weekly_progress()
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

        using var closeDayRequest = new HttpRequestMessage(HttpMethod.Post, "/api/close-day");
        closeDayRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var closeDayResponse = await fixture.BackendClient.SendAsync(closeDayRequest);
        closeDayResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var closeDayBody = await closeDayResponse.Content.ReadAsStringAsync();
        using var closeDayJson = JsonDocument.Parse(closeDayBody);
        closeDayJson.RootElement.GetProperty("totalCalories").GetInt32().Should().Be(600);
        closeDayJson.RootElement.GetProperty("mealsCount").GetInt32().Should().Be(1);
        var closedDate = closeDayJson.RootElement.GetProperty("date").GetString();

        // Closing the same day again fails — it's already closed.
        using var closeDayAgainRequest = new HttpRequestMessage(HttpMethod.Post, "/api/close-day");
        closeDayAgainRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var closeDayAgainResponse = await fixture.BackendClient.SendAsync(closeDayAgainRequest);
        closeDayAgainResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var getDayHistoryRequest = new HttpRequestMessage(HttpMethod.Get, "/api/day-history");
        getDayHistoryRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getDayHistoryResponse = await fixture.BackendClient.SendAsync(getDayHistoryRequest);
        getDayHistoryResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var dayHistoryBody = await getDayHistoryResponse.Content.ReadAsStringAsync();
        using var dayHistoryJson = JsonDocument.Parse(dayHistoryBody);
        var days = dayHistoryJson.RootElement.EnumerateArray().ToList();
        days.Should().ContainSingle();
        days[0].GetProperty("date").GetString().Should().Be(closedDate);
        days[0].GetProperty("totalCalories").GetInt32().Should().Be(600);

        using var getWeeklyProgressRequest = new HttpRequestMessage(HttpMethod.Get, "/api/weekly-progress");
        getWeeklyProgressRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getWeeklyProgressResponse = await fixture.BackendClient.SendAsync(getWeeklyProgressRequest);
        getWeeklyProgressResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var weeklyProgressBody = await getWeeklyProgressResponse.Content.ReadAsStringAsync();
        using var weeklyProgressJson = JsonDocument.Parse(weeklyProgressBody);
        var weeklyDays = weeklyProgressJson.RootElement.GetProperty("days").EnumerateArray().ToList();
        var today = weeklyDays.Single(d => d.GetProperty("date").GetString() == closedDate);
        today.GetProperty("consumedCalories").GetInt32().Should().Be(600);
        today.GetProperty("mealsCount").GetInt32().Should().Be(1);
        today.GetProperty("isClosed").GetBoolean().Should().BeTrue();
    }

    // No "no meals logged today" acceptance fact: both fake-oidc users end up with meals logged
    // today by the time this class runs (this class's own POST /api/meals above, and
    // MealsJourneyTests' for the other user), since acceptance tests share one database across
    // the whole run (see ../README.md) — there's no user guaranteed to have zero meals today.
    // ClosedDaysManagerTests.CloseDayAsync_FailsValidation_WhenNoMealsLoggedToday already covers
    // this guard far more cheaply and reliably.

    [Fact]
    public async Task CloseDay_without_a_bearer_token_returns_401()
    {
        using var response = await fixture.BackendClient.PostAsync("/api/close-day", content: null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Slice 1 (docs/plan/02-vertical-slices.md): one full journey (log in via fake-oidc, save a
/// profile, read it back and see it persisted) plus the unauthenticated boundary check — mirrors
/// PingJourneyTests' scope and reasoning. Reforge.Core.Tests/Reforge.Infra.PersistenceTests
/// already cover ProfileManager/ProfileRepository far more cheaply; this only proves the image's
/// public wire contract (OIDC auth, EF Core + migrations, the jsonb columns) works end to end.
///
/// Request/response bodies are built/asserted via anonymous objects and JsonDocument, never by
/// referencing Reforge.Core's DTOs — see ../README.md's "no shared fixtures, no reused internal
/// DTOs" rule. Unlike the source Node backend (which captures arbitrary top-level request keys
/// into extraData via object rest), Reforge's SaveProfileRequestDto keeps extraData as its own
/// explicit JSON property — plain, typed model binding, no custom capture-the-rest behavior.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class ProfileJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task PostThenGetProfile_with_a_real_fake_oidc_token_persists_the_profile()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/profile")
        {
            Content = JsonContent.Create(new
            {
                age = 29,
                gender = "female",
                height = 168.0,
                weight = 62.5,
                activityLevel = "moderate",
                goal = "recomposition",
                trainingDays = new[] { "monday", "wednesday", "friday" },
                trainingType = "strength",
                trainingTime = "morning",
                restrictions = "vegetarian",
                calorieTarget = 2100,
                extraData = new { favoriteColor = "blue" }
            })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);
        postResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getRequest = new HttpRequestMessage(HttpMethod.Get, "/api/profile");
        getRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var getResponse = await fixture.BackendClient.SendAsync(getRequest);
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await getResponse.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        json.RootElement.GetProperty("age").GetInt32().Should().Be(29);
        json.RootElement.GetProperty("goal").GetString().Should().Be("recomposition");
        json.RootElement.GetProperty("trainingDays").EnumerateArray().Select(e => e.GetString())
            .Should().Equal("monday", "wednesday", "friday");
        json.RootElement.GetProperty("calorieTarget").GetInt32().Should().Be(2100);
        json.RootElement.GetProperty("extraData").GetProperty("favoriteColor").GetString().Should().Be("blue");
    }

    [Fact]
    public async Task GetProfile_for_a_user_with_no_saved_profile_returns_404()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcSecondUserKey);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/profile");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await fixture.BackendClient.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetProfile_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/profile");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

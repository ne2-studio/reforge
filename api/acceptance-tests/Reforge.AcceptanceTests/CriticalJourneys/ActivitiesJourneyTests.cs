using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Slice 4 (docs/plan/02-vertical-slices.md): a user's logged activities — create + list only, no
/// update/delete. One full journey — log in via fake-oidc, POST an activity, GET it back — mirrors
/// MealLibraryJourneyTests' scope and reasoning. Reforge.Core.Tests/Reforge.Infra.PersistenceTests
/// already cover ActivitiesManager/ActivityRepository far more cheaply; this only proves the
/// image's public wire contract (OIDC auth, EF Core + migrations) works end to end.
///
/// Request/response bodies are built/asserted via anonymous objects and JsonDocument, never by
/// referencing Reforge.Core's DTOs — see ../README.md's "no shared fixtures, no reused internal
/// DTOs" rule.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class ActivitiesJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task PostGet_with_a_real_fake_oidc_token_persists_and_lists_the_activity()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/activities")
        {
            Content = JsonContent.Create(new
            {
                type = "cardio",
                duration = 45
            })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);
        postResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getRequest = new HttpRequestMessage(HttpMethod.Get, "/api/activities");
        getRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getResponse = await fixture.BackendClient.SendAsync(getRequest);
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getBody = await getResponse.Content.ReadAsStringAsync();
        using var getJson = JsonDocument.Parse(getBody);
        var items = getJson.RootElement.EnumerateArray().ToList();
        items.Should().ContainSingle();
        items[0].GetProperty("type").GetString().Should().Be("cardio");
        items[0].GetProperty("duration").GetInt32().Should().Be(45);
    }

    [Fact]
    public async Task GetActivities_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/activities");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PostActivity_without_a_bearer_token_returns_401()
    {
        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/activities")
        {
            Content = JsonContent.Create(new { type = "neat", steps = 8000 })
        };

        using var response = await fixture.BackendClient.SendAsync(postRequest);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

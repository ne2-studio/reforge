using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Slice 3 (docs/plan/02-vertical-slices.md): a user's reusable meal templates. One full journey
/// — log in via fake-oidc, POST an item, GET the library back, DELETE it, then GET again to
/// confirm it's gone — mirrors MealsJourneyTests' scope and reasoning.
/// Reforge.Core.Tests/Reforge.Infra.PersistenceTests already cover
/// MealLibraryManager/MealLibraryRepository far more cheaply; this only proves the image's public
/// wire contract (OIDC auth, EF Core + migrations) works end to end.
///
/// Request/response bodies are built/asserted via anonymous objects and JsonDocument, never by
/// referencing Reforge.Core's DTOs — see ../README.md's "no shared fixtures, no reused internal
/// DTOs" rule.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class MealLibraryJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task PostGetDeleteGet_with_a_real_fake_oidc_token_persists_and_removes_the_library_item()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/meal-library")
        {
            Content = JsonContent.Create(new
            {
                title = "Chicken and rice",
                description = "A simple bulking staple",
                category = "lunch",
                calories = 600,
                protein = 50,
                carbs = 60,
                fats = 15
            })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);
        postResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var postedBody = await postResponse.Content.ReadAsStringAsync();
        using var postedJson = JsonDocument.Parse(postedBody);
        var itemId = postedJson.RootElement.GetProperty("id").GetGuid();

        using var getRequest = new HttpRequestMessage(HttpMethod.Get, "/api/meal-library");
        getRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getResponse = await fixture.BackendClient.SendAsync(getRequest);
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getBody = await getResponse.Content.ReadAsStringAsync();
        using var getJson = JsonDocument.Parse(getBody);
        var items = getJson.RootElement.EnumerateArray().ToList();
        items.Should().ContainSingle();
        items[0].GetProperty("title").GetString().Should().Be("Chicken and rice");
        items[0].GetProperty("calories").GetInt32().Should().Be(600);

        using var deleteRequest = new HttpRequestMessage(HttpMethod.Delete, $"/api/meal-library/{itemId}");
        deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var deleteResponse = await fixture.BackendClient.SendAsync(deleteRequest);
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getAfterDeleteRequest = new HttpRequestMessage(HttpMethod.Get, "/api/meal-library");
        getAfterDeleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getAfterDeleteResponse = await fixture.BackendClient.SendAsync(getAfterDeleteRequest);
        getAfterDeleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getAfterDeleteBody = await getAfterDeleteResponse.Content.ReadAsStringAsync();
        using var getAfterDeleteJson = JsonDocument.Parse(getAfterDeleteBody);
        getAfterDeleteJson.RootElement.EnumerateArray().Should().BeEmpty();
    }

    [Fact]
    public async Task GetMealLibrary_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/meal-library");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteMealLibraryItem_owned_by_another_user_returns_404_not_403()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var ownerToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);
        var otherUserToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcSecondUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/meal-library")
        {
            Content = JsonContent.Create(new
            {
                title = "Owner's meal",
                description = "Belongs to the first user",
                category = "dinner",
                calories = 700,
                protein = 40,
                carbs = 70,
                fats = 20
            })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);
        postResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var postedBody = await postResponse.Content.ReadAsStringAsync();
        using var postedJson = JsonDocument.Parse(postedBody);
        var itemId = postedJson.RootElement.GetProperty("id").GetGuid();

        using var deleteRequest = new HttpRequestMessage(HttpMethod.Delete, $"/api/meal-library/{itemId}");
        deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", otherUserToken);
        using var deleteResponse = await fixture.BackendClient.SendAsync(deleteRequest);

        // 404, not 403 — a caller must never learn that a resource exists but isn't theirs. See
        // docs/API-CONVENTIONS.md.
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

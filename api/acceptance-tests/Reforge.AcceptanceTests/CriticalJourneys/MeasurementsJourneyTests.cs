using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Slice 5 (docs/plan/02-vertical-slices.md): a user's logged body measurements — create + list
/// only, no update/delete. One full journey — log in via fake-oidc, POST a measurement, GET it
/// back — mirrors ActivitiesJourneyTests' scope and reasoning. Reforge.Core.Tests/
/// Reforge.Infra.PersistenceTests already cover MeasurementsManager/MeasurementRepository far
/// more cheaply; this only proves the image's public wire contract (OIDC auth, EF Core +
/// migrations) works end to end, plus the one cross-layer behavior worth an HTTP-level check:
/// the all-null validation guard surfacing as a 400.
///
/// Request/response bodies are built/asserted via anonymous objects and JsonDocument, never by
/// referencing Reforge.Core's DTOs — see ../README.md's "no shared fixtures, no reused internal
/// DTOs" rule.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class MeasurementsJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task PostGet_with_a_real_fake_oidc_token_persists_and_lists_the_measurement()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/measurements")
        {
            Content = JsonContent.Create(new
            {
                weight = 82.5,
                waist = 85,
                neck = 38
            })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);
        postResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getRequest = new HttpRequestMessage(HttpMethod.Get, "/api/measurements");
        getRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getResponse = await fixture.BackendClient.SendAsync(getRequest);
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getBody = await getResponse.Content.ReadAsStringAsync();
        using var getJson = JsonDocument.Parse(getBody);
        var items = getJson.RootElement.EnumerateArray().ToList();
        items.Should().ContainSingle();
        items[0].GetProperty("weight").GetDouble().Should().Be(82.5);
        items[0].GetProperty("waist").GetDouble().Should().Be(85);
        items[0].GetProperty("neck").GetDouble().Should().Be(38);
    }

    [Fact]
    public async Task PostMeasurement_with_weight_waist_and_neck_all_null_returns_400()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/measurements")
        {
            Content = JsonContent.Create(new { })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);

        postResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetMeasurements_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/measurements");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PostMeasurement_without_a_bearer_token_returns_401()
    {
        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/measurements")
        {
            Content = JsonContent.Create(new { weight = 80 })
        };

        using var response = await fixture.BackendClient.SendAsync(postRequest);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

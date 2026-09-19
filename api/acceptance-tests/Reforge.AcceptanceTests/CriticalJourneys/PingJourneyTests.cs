using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Deliberately narrow, mirroring el-baul's acceptance-tests scope: one full journey (get a
/// real token from fake-oidc, call the one authenticated endpoint, confirm the response
/// reflects the token's own identity) plus one boundary check (an unauthenticated request to a
/// protected endpoint is rejected). This is not a second copy of the backend's own domain test
/// suite — Reforge.Core.Tests already covers PingManager's logic far more cheaply against a
/// hand-written fake. This only proves the image's public wire contract — OIDC token exchange,
/// JWT validation, user-sync-on-first-request, EF Core + migrations — works end to end.
///
/// Response shape is asserted via JsonDocument, never by referencing Reforge.Core's
/// PingResponseDto — see ../README.md's "no shared fixtures, no reused internal DTOs" rule.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class PingJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task GetPing_with_a_real_fake_oidc_token_returns_the_signed_in_users_sub()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/ping");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await fixture.BackendClient.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        json.RootElement.GetProperty("sub").GetString().Should().Be(ReforgeAcceptanceFixture.OidcUserSub);
        json.RootElement.TryGetProperty("serverTimeUtc", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetPing_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/ping");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

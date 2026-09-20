using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Reforge.AcceptanceTests.CriticalJourneys;

/// <summary>
/// Slice 6 (docs/plan/02-vertical-slices.md): a user's reminder preferences — a single 1:1
/// ReminderSettings plus many CustomReminders with full CRUD. Two journeys — log in via
/// fake-oidc, GET settings (404 before any save), PUT settings, GET again; then POST/GET/PUT/
/// DELETE a custom reminder — mirror MeasurementsJourneyTests'/MealLibraryJourneyTests' scope and
/// reasoning. Reforge.Core.Tests/Reforge.Infra.PersistenceTests already cover
/// RemindersManager/the repositories far more cheaply; this only proves the image's public wire
/// contract (OIDC auth, EF Core + migrations) works end to end, plus the one cross-layer behavior
/// worth an HTTP-level check per resource: ownership never leaking as 403 instead of 404.
///
/// Request/response bodies are built/asserted via anonymous objects and JsonDocument, never by
/// referencing Reforge.Core's DTOs — see ../README.md's "no shared fixtures, no reused internal
/// DTOs" rule.
/// </summary>
[Collection(AcceptanceTestCollection.Name)]
public class RemindersJourneyTests(ReforgeAcceptanceFixture fixture)
{
    [Fact]
    public async Task GetReminderSettings_before_any_save_returns_404()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcSecondUserKey);

        using var getRequest = new HttpRequestMessage(HttpMethod.Get, "/api/reminder-settings");
        getRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getResponse = await fixture.BackendClient.SendAsync(getRequest);

        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PutGet_with_a_real_fake_oidc_token_persists_and_returns_the_reminder_settings()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var putRequest = new HttpRequestMessage(HttpMethod.Put, "/api/reminder-settings")
        {
            Content = JsonContent.Create(new
            {
                enabled = true,
                channel = "push",
                defaultTime = "08:00"
            })
        };
        putRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var putResponse = await fixture.BackendClient.SendAsync(putRequest);
        putResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getRequest = new HttpRequestMessage(HttpMethod.Get, "/api/reminder-settings");
        getRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getResponse = await fixture.BackendClient.SendAsync(getRequest);
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getBody = await getResponse.Content.ReadAsStringAsync();
        using var getJson = JsonDocument.Parse(getBody);
        getJson.RootElement.GetProperty("enabled").GetBoolean().Should().BeTrue();
        getJson.RootElement.GetProperty("channel").GetString().Should().Be("push");
        getJson.RootElement.GetProperty("defaultTime").GetString().Should().Be("08:00");
    }

    [Fact]
    public async Task PutReminderSettings_with_an_empty_channel_returns_400()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var putRequest = new HttpRequestMessage(HttpMethod.Put, "/api/reminder-settings")
        {
            Content = JsonContent.Create(new { enabled = true, channel = "", defaultTime = "08:00" })
        };
        putRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var putResponse = await fixture.BackendClient.SendAsync(putRequest);

        putResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetReminderSettings_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/reminder-settings");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PostPutGetDeleteGet_with_a_real_fake_oidc_token_manages_a_custom_reminder_end_to_end()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/custom-reminders")
        {
            Content = JsonContent.Create(new
            {
                label = "Registra tu cena",
                time = "20:00",
                daysOfWeek = new[] { "monday", "wednesday", "friday" },
                enabled = true
            })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);
        postResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var postedBody = await postResponse.Content.ReadAsStringAsync();
        using var postedJson = JsonDocument.Parse(postedBody);
        var reminderId = postedJson.RootElement.GetProperty("id").GetGuid();

        using var putRequest = new HttpRequestMessage(HttpMethod.Put, $"/api/custom-reminders/{reminderId}")
        {
            Content = JsonContent.Create(new
            {
                label = "Registra tu almuerzo",
                time = "13:00",
                daysOfWeek = new[] { "tuesday" },
                enabled = false
            })
        };
        putRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var putResponse = await fixture.BackendClient.SendAsync(putRequest);
        putResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getRequest = new HttpRequestMessage(HttpMethod.Get, "/api/custom-reminders");
        getRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getResponse = await fixture.BackendClient.SendAsync(getRequest);
        var getBody = await getResponse.Content.ReadAsStringAsync();
        using var getJson = JsonDocument.Parse(getBody);
        var items = getJson.RootElement.EnumerateArray().ToList();
        items.Should().ContainSingle();
        items[0].GetProperty("label").GetString().Should().Be("Registra tu almuerzo");
        items[0].GetProperty("enabled").GetBoolean().Should().BeFalse();

        using var deleteRequest = new HttpRequestMessage(HttpMethod.Delete, $"/api/custom-reminders/{reminderId}");
        deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var deleteResponse = await fixture.BackendClient.SendAsync(deleteRequest);
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getAfterDeleteRequest = new HttpRequestMessage(HttpMethod.Get, "/api/custom-reminders");
        getAfterDeleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var getAfterDeleteResponse = await fixture.BackendClient.SendAsync(getAfterDeleteRequest);
        var getAfterDeleteBody = await getAfterDeleteResponse.Content.ReadAsStringAsync();
        using var getAfterDeleteJson = JsonDocument.Parse(getAfterDeleteBody);
        getAfterDeleteJson.RootElement.EnumerateArray().Should().BeEmpty();
    }

    [Fact]
    public async Task PostCustomReminder_with_no_days_of_week_returns_400()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        var accessToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/custom-reminders")
        {
            Content = JsonContent.Create(new
            {
                label = "Registra tu cena",
                time = "20:00",
                daysOfWeek = Array.Empty<string>(),
                enabled = true
            })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);

        postResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateCustomReminder_owned_by_another_user_returns_404_not_403()
    {
        using var tokenClient = fixture.CreateOidcTokenClient();
        // Deliberately the reverse pairing from the other tests in this file — the "owner" here
        // is OidcSecondUserKey, not OidcUserKey, so this test's own leftover reminder (this test
        // never deletes it under the owning token) can't pollute
        // PostPutGetDeleteGet_with_a_real_fake_oidc_token_manages_a_custom_reminder_end_to_end's
        // own ContainSingle assertion on OidcUserKey's reminders.
        var ownerToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcSecondUserKey);
        var otherUserToken = await tokenClient.GetAccessTokenAsync(ReforgeAcceptanceFixture.OidcUserKey);

        using var postRequest = new HttpRequestMessage(HttpMethod.Post, "/api/custom-reminders")
        {
            Content = JsonContent.Create(new
            {
                label = "Owner's reminder",
                time = "20:00",
                daysOfWeek = new[] { "monday" },
                enabled = true
            })
        };
        postRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        using var postResponse = await fixture.BackendClient.SendAsync(postRequest);
        postResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var postedBody = await postResponse.Content.ReadAsStringAsync();
        using var postedJson = JsonDocument.Parse(postedBody);
        var reminderId = postedJson.RootElement.GetProperty("id").GetGuid();

        using var putRequest = new HttpRequestMessage(HttpMethod.Put, $"/api/custom-reminders/{reminderId}")
        {
            Content = JsonContent.Create(new
            {
                label = "Hacked",
                time = "00:00",
                daysOfWeek = new[] { "sunday" },
                enabled = false
            })
        };
        putRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", otherUserToken);
        using var putResponse = await fixture.BackendClient.SendAsync(putRequest);

        // 404, not 403 — a caller must never learn that a resource exists but isn't theirs. See
        // docs/API-CONVENTIONS.md.
        putResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using var deleteRequest = new HttpRequestMessage(HttpMethod.Delete, $"/api/custom-reminders/{reminderId}");
        deleteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", otherUserToken);
        using var deleteResponse = await fixture.BackendClient.SendAsync(deleteRequest);

        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetCustomReminders_without_a_bearer_token_returns_401()
    {
        var response = await fixture.BackendClient.GetAsync("/api/custom-reminders");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

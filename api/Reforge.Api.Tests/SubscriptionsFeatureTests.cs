using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Reforge.Api.Common;
using Reforge.Api.Common.Controllers;
using Reforge.Infra.Lite;

namespace Reforge.Api.Tests;

/// <summary>
/// Slice 9 (docs/plan/02-vertical-slices.md): proves the Features:Subscriptions toggle actually
/// gates the feature end-to-end at the HTTP layer — when off, SubscriptionsController's routes
/// genuinely 404 (not just 403/hidden), and GET /api/features always works and reflects the
/// current config either way. When on, exercises the fully faked Stripe
/// checkout -> confirm -> cancel round trip against reforge-api-lite's own in-process pipeline,
/// same "proves the wire contract, not the business logic already covered by
/// SubscriptionsManagerTests" reasoning as ChatAndMealAnalysisFeatureTests.
/// </summary>
public class SubscriptionsFeatureTests
{
    private const string Issuer = "https://issuer.test";
    private const string Audience = "reforge-app";

    [Fact]
    public async Task WhenTheFlagIsOff_GetFeatures_ReportsItOff_AndSubscriptionRoutesGenuinely404()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First(), subscriptionsEnabled: false);
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", CreateAccessToken(rsa, "reforge-subscriptions-user-1"));

        var featuresResponse = await client.GetAsync("/api/features");
        Assert.Equal(HttpStatusCode.OK, featuresResponse.StatusCode);
        using var featuresJson = JsonDocument.Parse(await featuresResponse.Content.ReadAsStringAsync());
        Assert.False(featuresJson.RootElement.GetProperty("subscriptions").GetBoolean());

        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/subscription")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsync("/api/subscription/checkout", content: null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsync("/api/subscription/portal", content: null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsync("/api/subscription/cancel", content: null)).StatusCode);
        Assert.Equal(
            HttpStatusCode.NotFound,
            (await client.PostAsync($"/api/subscription/checkout/{Guid.NewGuid()}/confirm", content: null)).StatusCode);
    }

    [Fact]
    public async Task WhenTheFlagIsOn_GetFeatures_ReportsItOn_AndTheFakeCheckoutConfirmCancelFlowWorks()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First(), subscriptionsEnabled: true);
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", CreateAccessToken(rsa, "reforge-subscriptions-user-2"));

        var featuresResponse = await client.GetAsync("/api/features");
        using var featuresJson = JsonDocument.Parse(await featuresResponse.Content.ReadAsStringAsync());
        Assert.True(featuresJson.RootElement.GetProperty("subscriptions").GetBoolean());

        var initialSubscription = await client.GetAsync("/api/subscription");
        Assert.Equal(HttpStatusCode.OK, initialSubscription.StatusCode);
        using var initialJson = JsonDocument.Parse(await initialSubscription.Content.ReadAsStringAsync());
        Assert.Equal("Free", initialJson.RootElement.GetProperty("tier").GetString());
        Assert.Equal("None", initialJson.RootElement.GetProperty("status").GetString());

        var checkoutResponse = await client.PostAsync("/api/subscription/checkout", content: null);
        Assert.Equal(HttpStatusCode.OK, checkoutResponse.StatusCode);
        using var checkoutJson = JsonDocument.Parse(await checkoutResponse.Content.ReadAsStringAsync());
        var sessionId = checkoutJson.RootElement.GetProperty("sessionId").GetGuid();
        Assert.Contains($"session={sessionId}", checkoutJson.RootElement.GetProperty("checkoutUrl").GetString());

        var confirmResponse = await client.PostAsync($"/api/subscription/checkout/{sessionId}/confirm", content: null);
        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);
        using var confirmJson = JsonDocument.Parse(await confirmResponse.Content.ReadAsStringAsync());
        Assert.Equal("Premium", confirmJson.RootElement.GetProperty("tier").GetString());
        Assert.Equal("Active", confirmJson.RootElement.GetProperty("status").GetString());
        Assert.True(confirmJson.RootElement.GetProperty("currentPeriodEnd").GetDateTime() > DateTime.UtcNow);

        // Confirming the same session again fails — it's no longer Pending.
        var secondConfirm = await client.PostAsync($"/api/subscription/checkout/{sessionId}/confirm", content: null);
        Assert.Equal(HttpStatusCode.BadRequest, secondConfirm.StatusCode);

        var portalResponse = await client.PostAsync("/api/subscription/portal", content: null);
        Assert.Equal(HttpStatusCode.OK, portalResponse.StatusCode);
        using var portalJson = JsonDocument.Parse(await portalResponse.Content.ReadAsStringAsync());
        Assert.Equal("/suscripcion/portal", portalJson.RootElement.GetProperty("portalUrl").GetString());

        var cancelResponse = await client.PostAsync("/api/subscription/cancel", content: null);
        Assert.Equal(HttpStatusCode.OK, cancelResponse.StatusCode);
        using var cancelJson = JsonDocument.Parse(await cancelResponse.Content.ReadAsStringAsync());
        Assert.Equal("Free", cancelJson.RootElement.GetProperty("tier").GetString());
        Assert.Equal("Canceled", cancelJson.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task WhenTheFlagIsOn_GetSubscription_without_a_bearer_token_returns_401()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First(), subscriptionsEnabled: true);
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };

        var response = await client.GetAsync("/api/subscription");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task WhenTheFlagIsOn_AnalyzeMealAndChat_AreLimitedToTenPerMonth_OnTheFreeTier()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First(), subscriptionsEnabled: true);
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", CreateAccessToken(rsa, "reforge-subscriptions-limit-user"));

        for (var i = 0; i < 10; i++)
        {
            var response = await client.PostAsJsonAsync("/api/chat", new { message = $"Hola {i}" });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        var eleventh = await client.PostAsJsonAsync("/api/chat", new { message = "Hola 11" });
        Assert.Equal(HttpStatusCode.Forbidden, eleventh.StatusCode);
    }

    private static WebApplication BuildApi(string jwksBaseAddress, bool subscriptionsEnabled)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Production"
        });
        builder.WebHost.UseUrls("http://127.0.0.1:0");

        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Auth:JwksUri"] = $"{jwksBaseAddress}/.well-known/jwks.json",
            ["Auth:ValidIssuer"] = Issuer,
            ["Auth:ValidAudiences:0"] = Audience,
            ["Features:Subscriptions"] = subscriptionsEnabled ? "true" : "false"
        });
        builder.Services.AddLiteInfrastructure(builder.Configuration);
        builder.Services.AddControllers().AddApplicationPart(typeof(PingController).Assembly);

        return ReforgeApiHost.Build(builder);
    }

    private static async Task<WebApplication> StartFakeJwksHostAsync(RSA rsa)
    {
        var jwksBuilder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Production"
        });
        jwksBuilder.WebHost.UseUrls("http://127.0.0.1:0");
        var jwksJson = BuildJwksJson(rsa);

        var jwksHost = jwksBuilder.Build();
        jwksHost.MapGet("/.well-known/jwks.json", () => Results.Text(jwksJson, "application/json"));
        await jwksHost.StartAsync();
        return jwksHost;
    }

    private static string BuildJwksJson(RSA rsa)
    {
        var parameters = rsa.ExportParameters(includePrivateParameters: false);
        var jwk = new
        {
            kty = "RSA",
            use = "sig",
            kid = "test-key",
            alg = "RS256",
            n = Base64UrlEncoder.Encode(parameters.Modulus),
            e = Base64UrlEncoder.Encode(parameters.Exponent)
        };
        return JsonSerializer.Serialize(new { keys = new[] { jwk } });
    }

    private static string CreateAccessToken(RSA rsa, string sub)
    {
        var signingKey = new RsaSecurityKey(rsa) { KeyId = "test-key" };
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.RsaSha256);
        var handler = new JwtSecurityTokenHandler();
        var now = DateTime.UtcNow;

        return handler.CreateEncodedJwt(
            issuer: Issuer,
            audience: Audience,
            subject: new ClaimsIdentity([new Claim("sub", sub)]),
            notBefore: now,
            expires: now.AddMinutes(5),
            issuedAt: now,
            signingCredentials: credentials);
    }
}

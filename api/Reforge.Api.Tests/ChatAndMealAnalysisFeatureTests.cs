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
using Reforge.Core.Chat.OutputPorts;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Infra.Lite;

namespace Reforge.Api.Tests;

/// <summary>
/// Slice 8 (docs/plan/02-vertical-slices.md): POST /analyze-meal, POST /chat, GET /chat-history
/// against reforge-api-lite's own in-process pipeline (real ReforgeApiHost/AddLiteInfrastructure,
/// real auth), scripting the fake AI backends (FakeMealAnalysisBackend/FakeAiChatBackend) that
/// api-lite/automated tests use instead of the real OpenAI adapters — the real OpenAI API is
/// never called from automated tests (docs/plan/00-overview.md, decision 5).
/// Reforge.Core.Tests already covers MealsManager/ChatManager's own logic far more cheaply; this
/// only proves the wire contract (auth, DI wiring, controller/DTO shapes) works end to end, same
/// reasoning as AuthPolicyTests.
/// </summary>
public class ChatAndMealAnalysisFeatureTests
{
    private const string Issuer = "https://issuer.test";
    private const string Audience = "reforge-app";

    [Fact]
    public async Task PostAnalyzeMeal_SavesTheMeal_UsingTheFakeBackendsAnalysis()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First());
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", CreateAccessToken(rsa, "reforge-user"));

        var analysisBackend = (FakeMealAnalysisBackend)app.Services.GetRequiredService<IMealAnalysisBackend>();
        analysisBackend.NextAnalysis = Core.Shared.Result.Success(
            new MealAnalysisDto(Calories: 620, Protein: 45, Carbs: 55, Fats: 18, Feedback: "Buen balance de macros"));

        var response = await client.PostAsJsonAsync("/api/analyze-meal", new
        {
            mealText = "Chicken and rice",
            category = "lunch",
            time = "13:00"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        Assert.Equal(620, json.RootElement.GetProperty("calories").GetInt32());
        Assert.Equal(45, json.RootElement.GetProperty("protein").GetInt32());
        Assert.Equal("Buen balance de macros", json.RootElement.GetProperty("feedback").GetString());

        var single = Assert.Single(analysisBackend.Calls);
        Assert.Equal("Chicken and rice", single.MealText);
        Assert.Equal("lunch", single.Category);
    }

    [Fact]
    public async Task PostAnalyzeMeal_PropagatesTheBackendsFailure_As503()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First());
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", CreateAccessToken(rsa, "reforge-user"));

        var analysisBackend = (FakeMealAnalysisBackend)app.Services.GetRequiredService<IMealAnalysisBackend>();
        analysisBackend.NextAnalysis = Core.Shared.Result.Failure<MealAnalysisDto>(
            Core.Shared.ApplicationError.ExternalDependencyUnavailable("Meal analysis is not configured."));

        var response = await client.PostAsJsonAsync("/api/analyze-meal", new
        {
            mealText = "Chicken and rice",
            category = "lunch",
            time = "13:00"
        });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task PostChat_ReturnsTheFakeBackendsReply_AndGetChatHistoryReturnsTheSavedTurn()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First());
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", CreateAccessToken(rsa, "reforge-chat-user"));

        var aiChatBackend = (FakeAiChatBackend)app.Services.GetRequiredService<IAiChatBackend>();
        aiChatBackend.NextResult = Core.Shared.Result.Success("¡Vas muy bien hoy!");

        var chatResponse = await client.PostAsJsonAsync("/api/chat", new { message = "¿Cómo voy hoy?" });

        Assert.Equal(HttpStatusCode.OK, chatResponse.StatusCode);
        var chatBody = await chatResponse.Content.ReadAsStringAsync();
        using var chatJson = JsonDocument.Parse(chatBody);
        Assert.Equal("¡Vas muy bien hoy!", chatJson.RootElement.GetProperty("reply").GetString());

        var historyResponse = await client.GetAsync("/api/chat-history");
        Assert.Equal(HttpStatusCode.OK, historyResponse.StatusCode);
        var historyBody = await historyResponse.Content.ReadAsStringAsync();
        using var historyJson = JsonDocument.Parse(historyBody);
        var messages = historyJson.RootElement.EnumerateArray().ToList();
        var saved = Assert.Single(messages);
        Assert.Equal("¿Cómo voy hoy?", saved.GetProperty("userMessage").GetString());
        Assert.Equal("¡Vas muy bien hoy!", saved.GetProperty("assistantMessage").GetString());
    }

    [Fact]
    public async Task PostChat_without_a_bearer_token_returns_401()
    {
        using var rsa = RSA.Create(2048);
        await using var jwksHost = await StartFakeJwksHostAsync(rsa);
        await using var app = BuildApi(jwksHost.Urls.First());
        await app.StartAsync();
        using var client = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };

        var response = await client.PostAsJsonAsync("/api/chat", new { message = "Hola" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static WebApplication BuildApi(string jwksBaseAddress)
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
            ["Auth:ValidAudiences:0"] = Audience
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

using System.Net;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using Reforge.Core.Profiles.Domain;
using Reforge.Infra.Meals;
using Reforge.Infra.OpenAi;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;

namespace Reforge.Infra.Tests;

/// <summary>
/// Same fake-HTTP-server approach as OpenAiChatBackendTests, plus dedicated coverage for the
/// JSON-parsing robustness ported from recomp-coach-backend/supabase/functions/server/routes/
/// meals.ts's /analyze-meal handler: a direct parse first, then a ```json (or plain ```) fenced
/// block, then failure if neither yields the required calories/protein fields.
/// </summary>
public class OpenAiMealAnalysisBackendTests
{
    private const string ChatPath = "/v1/chat/completions";

    private static OpenAiMealAnalysisBackend CreateBackend(string baseUrl, string apiKey = "sk-test") =>
        new(
            new HttpClient(),
            Options.Create(new OpenAiOptions { ApiKey = apiKey, Model = "gpt-4o-mini", BaseUrl = baseUrl }),
            Substitute.For<ILogger<OpenAiMealAnalysisBackend>>());

    private static void RespondWithContent(WireMockServer server, string content) =>
        server.Given(Request.Create().WithPath(ChatPath).UsingPost())
            .RespondWith(Response.Create().WithStatusCode(HttpStatusCode.OK).WithBodyAsJson(new
            {
                choices = new[] { new { message = new { role = "assistant", content } } }
            }));

    [Fact]
    public async Task AnalyzeAsync_ShouldFail_WithoutHittingTheNetwork_WhenApiKeyIsNotConfigured()
    {
        using var server = WireMockServer.Start();
        var backend = CreateBackend(server.Url!, apiKey: "");

        var result = await backend.AnalyzeAsync("Chicken and rice", "lunch", profile: null);

        Assert.True(result.IsFailure);
        Assert.Empty(server.LogEntries);
    }

    [Fact]
    public async Task AnalyzeAsync_ShouldFail_WhenOpenAiRespondsWithAnErrorStatus()
    {
        using var server = WireMockServer.Start();
        server.Given(Request.Create().WithPath(ChatPath).UsingPost())
            .RespondWith(Response.Create().WithStatusCode(HttpStatusCode.TooManyRequests).WithBody("rate limited"));
        var backend = CreateBackend(server.Url!);

        var result = await backend.AnalyzeAsync("Chicken and rice", "lunch", profile: null);

        Assert.True(result.IsFailure);
    }

    [Fact]
    public async Task AnalyzeAsync_ShouldParseADirectJsonObject()
    {
        using var server = WireMockServer.Start();
        RespondWithContent(server, """{"calories":620,"protein":45,"carbs":55,"fats":18,"feedback":"Buen balance de macros"}""");
        var backend = CreateBackend(server.Url!);

        var result = await backend.AnalyzeAsync("Chicken and rice", "lunch", profile: null);

        Assert.True(result.IsSuccess);
        Assert.Equal(620, result.Value.Calories);
        Assert.Equal(45, result.Value.Protein);
        Assert.Equal(55, result.Value.Carbs);
        Assert.Equal(18, result.Value.Fats);
        Assert.Equal("Buen balance de macros", result.Value.Feedback);
    }

    [Fact]
    public async Task AnalyzeAsync_ShouldParseAJsonFencedCodeBlock_WhenTheDirectParseFails()
    {
        using var server = WireMockServer.Start();
        RespondWithContent(server, """
            Aquí tienes el análisis:
            ```json
            {"calories":500,"protein":30,"carbs":40,"fats":10,"feedback":"Bien"}
            ```
            """);
        var backend = CreateBackend(server.Url!);

        var result = await backend.AnalyzeAsync("Chicken and rice", "lunch", profile: null);

        Assert.True(result.IsSuccess);
        Assert.Equal(500, result.Value.Calories);
        Assert.Equal(30, result.Value.Protein);
    }

    [Fact]
    public async Task AnalyzeAsync_ShouldFail_WhenNeitherADirectParseNorAFencedBlockYieldsRequiredFields()
    {
        using var server = WireMockServer.Start();
        RespondWithContent(server, "I can't help with that.");
        var backend = CreateBackend(server.Url!);

        var result = await backend.AnalyzeAsync("Chicken and rice", "lunch", profile: null);

        Assert.True(result.IsFailure);
    }

    [Fact]
    public async Task AnalyzeAsync_ShouldFail_WhenRequiredFieldsAreMissing()
    {
        using var server = WireMockServer.Start();
        RespondWithContent(server, """{"carbs":40,"fats":10,"feedback":"Bien"}""");
        var backend = CreateBackend(server.Url!);

        var result = await backend.AnalyzeAsync("Chicken and rice", "lunch", profile: null);

        Assert.True(result.IsFailure);
    }

    [Fact]
    public async Task AnalyzeAsync_ShouldDefaultCarbsFatsAndFeedback_WhenOnlyCaloriesAndProteinArePresent()
    {
        using var server = WireMockServer.Start();
        RespondWithContent(server, """{"calories":500,"protein":30}""");
        var backend = CreateBackend(server.Url!);

        var result = await backend.AnalyzeAsync("Chicken and rice", "lunch", profile: null);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, result.Value.Carbs);
        Assert.Equal(0, result.Value.Fats);
        Assert.Equal("", result.Value.Feedback);
    }

    [Fact]
    public async Task AnalyzeAsync_ShouldSendTheMealTextCategoryAndProfileContextWithBearerAuth()
    {
        using var server = WireMockServer.Start();
        RespondWithContent(server, """{"calories":500,"protein":30,"carbs":40,"fats":10,"feedback":"Bien"}""");
        var backend = CreateBackend(server.Url!, apiKey: "sk-secret");
        var profile = new UserProfile(new Reforge.Domain.UserId("user-1"), DateTime.UtcNow, weight: 70, goal: "recomp");

        await backend.AnalyzeAsync("Chicken and rice", "lunch", profile);

        var request = Assert.Single(server.LogEntries).RequestMessage!;
        Assert.Equal("Bearer sk-secret", request.Headers!["Authorization"].ToString());
        using var sentBody = System.Text.Json.JsonDocument.Parse(request.Body!);
        var messages = sentBody.RootElement.GetProperty("messages").EnumerateArray().ToList();
        Assert.Equal("Comida (lunch): Chicken and rice", messages[1].GetProperty("content").GetString());
        Assert.Contains("\"Goal\":\"recomp\"", messages[0].GetProperty("content").GetString());
        Assert.True(sentBody.RootElement.TryGetProperty("response_format", out _));
    }
}

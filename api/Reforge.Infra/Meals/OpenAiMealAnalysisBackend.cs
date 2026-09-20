using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Shared;
using Reforge.Infra.OpenAi;

namespace Reforge.Infra.Meals;

// Ports recomp-coach-backend's routes/meals.ts POST /analyze-meal AI path: a raw HttpClient POST
// to {BaseUrl}/v1/chat/completions asking for a JSON object with calories/protein/carbs/fats/
// feedback, same request_format/parsing-robustness behavior as the source (direct JSON.parse
// first, then a ```json fenced block, then fail). Same shape/error semantics as
// Reforge.Infra.Chat.OpenAiChatBackend — ApplicationError.ExternalDependencyUnavailable on any
// failure (missing key, non-success status, unparsable/incomplete response).
public partial class OpenAiMealAnalysisBackend(HttpClient httpClient, IOptions<OpenAiOptions> options, ILogger<OpenAiMealAnalysisBackend> logger)
    : IMealAnalysisBackend
{
    private static readonly JsonSerializerOptions AnalysisJsonOptions = new(JsonSerializerDefaults.Web);

    private record OpenAiMessage(string Role, string Content);
    private record ResponseFormatSpec(string Type);

    private record OpenAiRequest(
        string Model,
        OpenAiMessage[] Messages,
        double Temperature,
        [property: JsonPropertyName("response_format")] ResponseFormatSpec ResponseFormat);

    private record OpenAiChoice(OpenAiMessage Message);
    private record OpenAiResponse(OpenAiChoice[] Choices);

    private record AnalysisJson(int? Calories, int? Protein, int? Carbs, int? Fats, string? Feedback);

    public async Task<Result<MealAnalysisDto>> AnalyzeAsync(string mealText, string category, UserProfile? profile)
    {
        if (string.IsNullOrEmpty(options.Value.ApiKey))
        {
            logger.LogWarning("OpenAi:ApiKey is not configured; cannot analyze a meal");
            return Result.Failure<MealAnalysisDto>(ApplicationError.ExternalDependencyUnavailable("Meal analysis is not configured."));
        }

        var request = new OpenAiRequest(
            options.Value.Model,
            [
                new OpenAiMessage("system", BuildSystemPrompt(profile)),
                new OpenAiMessage("user", $"Comida ({category}): {mealText}")
            ],
            Temperature: 0.7,
            ResponseFormat: new ResponseFormatSpec("json_object"));

        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{options.Value.BaseUrl}/v1/chat/completions")
            {
                Content = JsonContent.Create(request)
            };
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.Value.ApiKey);

            using var response = await httpClient.SendAsync(httpRequest);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                logger.LogError("OpenAI meal analysis failed {StatusCode} {Body}", response.StatusCode, body);
                return Result.Failure<MealAnalysisDto>(ApplicationError.ExternalDependencyUnavailable($"OpenAI returned {response.StatusCode}"));
            }

            var payload = await response.Content.ReadFromJsonAsync<OpenAiResponse>();
            var content = payload?.Choices.FirstOrDefault()?.Message.Content;
            if (string.IsNullOrEmpty(content))
            {
                logger.LogError("OpenAI meal analysis response contained no content");
                return Result.Failure<MealAnalysisDto>(ApplicationError.ExternalDependencyUnavailable("OpenAI response contained no content"));
            }

            var analysis = ParseAnalysis(content);
            if (analysis is null || analysis.Calories is null || analysis.Protein is null)
            {
                logger.LogError("OpenAI meal analysis response missing required fields: {Content}", content);
                return Result.Failure<MealAnalysisDto>(ApplicationError.ExternalDependencyUnavailable("AI response missing required fields"));
            }

            return Result.Success(new MealAnalysisDto(
                analysis.Calories.Value,
                analysis.Protein.Value,
                analysis.Carbs ?? 0,
                analysis.Fats ?? 0,
                analysis.Feedback ?? ""));
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "OpenAI meal analysis failed");
            return Result.Failure<MealAnalysisDto>(ApplicationError.ExternalDependencyUnavailable("Failed to analyze the meal."));
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "OpenAI meal analysis returned a malformed response body");
            return Result.Failure<MealAnalysisDto>(ApplicationError.ExternalDependencyUnavailable("OpenAI response contained no content"));
        }
    }

    // Tries a direct parse first, then a ```json (or plain ```) fenced block — same robustness
    // as recomp-coach-backend's routes/meals.ts /analyze-meal handler.
    private static AnalysisJson? ParseAnalysis(string content)
    {
        try
        {
            return JsonSerializer.Deserialize<AnalysisJson>(content, AnalysisJsonOptions);
        }
        catch (JsonException)
        {
            var match = CodeFencePattern().Match(content);
            if (!match.Success)
                return null;

            try
            {
                return JsonSerializer.Deserialize<AnalysisJson>(match.Groups[1].Value, AnalysisJsonOptions);
            }
            catch (JsonException)
            {
                return null;
            }
        }
    }

    private static string BuildSystemPrompt(UserProfile? profile) => """
        Eres un nutricionista experto en recomposición corporal. Analiza las comidas y proporciona SOLO un objeto JSON válido con la siguiente estructura:

        {
          "calories": número,
          "protein": número,
          "carbs": número,
          "fats": número,
          "feedback": "texto breve en español"
        }

        IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON, sin texto adicional ni markdown.

        Contexto del usuario:
        """.TrimEnd() + " " + DescribeProfile(profile);

    private static string DescribeProfile(UserProfile? profile) => profile is null
        ? "No disponible"
        : JsonSerializer.Serialize(new
        {
            profile.Age,
            profile.Gender,
            profile.Height,
            profile.Weight,
            profile.ActivityLevel,
            profile.Goal,
            profile.TrainingDays,
            profile.TrainingType,
            profile.TrainingTime,
            profile.Restrictions,
            profile.CalorieTarget
        });

    [GeneratedRegex(@"```(?:json)?\s*([\s\S]*?)\s*```")]
    private static partial Regex CodeFencePattern();
}

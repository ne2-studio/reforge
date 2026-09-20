using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Shared;

namespace Reforge.Infra.Lite;

// Same shape/rationale as FakeAiChatBackend: records calls, has a settable NextAnalysis, no
// network calls. Registered as a Singleton in reforge-api-lite (see ServiceRegistration), so —
// unlike its use in Reforge.Core.Tests — this can be hit by genuinely concurrent requests; a bare
// List.Add is not safe under concurrent writers.
public class FakeMealAnalysisBackend : IMealAnalysisBackend
{
    private readonly Lock _lock = new();

    public List<(string MealText, string Category, UserProfile? Profile)> Calls { get; } = [];

    public Result<MealAnalysisDto> NextAnalysis { get; set; } =
        Result.Success(new MealAnalysisDto(Calories: 500, Protein: 30, Carbs: 50, Fats: 15, Feedback: "Buena elección"));

    public Task<Result<MealAnalysisDto>> AnalyzeAsync(string mealText, string category, UserProfile? profile)
    {
        lock (_lock) Calls.Add((mealText, category, profile));
        return Task.FromResult(NextAnalysis);
    }
}

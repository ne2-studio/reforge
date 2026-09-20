using Reforge.Core.Profiles.Domain;
using Reforge.Core.Shared;

namespace Reforge.Core.Meals.OutputPorts;

// Secondary port for whichever LLM actually analyzes a free-text meal description into macros —
// currently OpenAI, see Reforge.Infra.Meals.OpenAiMealAnalysisBackend. Lets MealsManager swap
// providers without depending on any concrete AI adapter. Mirrors el-baul's IAiChatBackend
// shape/naming (see Reforge.Core.Chat.OutputPorts.IAiChatBackend).
public interface IMealAnalysisBackend
{
    /// <summary>Analyzes a free-text meal description (category and optional caller profile
    /// given as context) into estimated macros plus short Spanish feedback. Fails with
    /// ExternalDependencyUnavailable if the backend isn't configured, the HTTP call fails, or the
    /// response can't be parsed into the expected shape.</summary>
    Task<Result<MealAnalysisDto>> AnalyzeAsync(string mealText, string category, UserProfile? profile);
}

public record MealAnalysisDto(int Calories, int Protein, int Carbs, int Fats, string Feedback);

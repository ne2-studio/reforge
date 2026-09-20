namespace Reforge.Infra.OpenAi;

// Bound from the "OpenAi" configuration section (see Reforge.Api/appsettings.json), shared by
// both OpenAiChatBackend and OpenAiMealAnalysisBackend — mirrors el-baul's
// ElBaul.Infra.Chat.OpenAiOptions.
public class OpenAiOptions
{
    public string ApiKey { get; init; } = "";
    public string Model { get; init; } = "gpt-4o-mini";
    public string BaseUrl { get; init; } = "https://api.openai.com";
}

using Reforge.Core.Shared;

namespace Reforge.Core.Chat.OutputPorts;

public record ChatTurn(string Role, string Content);

// Secondary port for whichever LLM actually answers coach-chat questions (currently OpenAI, see
// Reforge.Infra.Chat.OpenAiChatBackend). Lets ChatManager swap providers without touching it.
// Mirrors el-baul's ElBaul.Core.Chat.OutputPorts.IAiChatBackend verbatim.
public interface IAiChatBackend
{
    Task<Result<string>> GetReplyAsync(string systemPrompt, IEnumerable<ChatTurn> history);
}

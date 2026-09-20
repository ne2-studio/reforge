using Reforge.Core.Chat.OutputPorts;
using Reforge.Core.Shared;

namespace Reforge.Infra.Lite;

// Mirrors el-baul's ElBaul.Infra.Lite.FakeAiChatBackend: records calls, has a settable
// NextResult, no network calls. Registered as a Singleton in reforge-api-lite (see
// ServiceRegistration), so — unlike its use in Reforge.Core.Tests — this can be hit by genuinely
// concurrent requests; a bare List.Add is not safe under concurrent writers.
public class FakeAiChatBackend : IAiChatBackend
{
    private readonly Lock _lock = new();

    public List<(string SystemPrompt, List<ChatTurn> History)> Calls { get; } = [];
    public Result<string> NextResult { get; set; } = Result.Success("Respuesta de prueba");

    public Task<Result<string>> GetReplyAsync(string systemPrompt, IEnumerable<ChatTurn> history)
    {
        lock (_lock) Calls.Add((systemPrompt, history.ToList()));
        return Task.FromResult(NextResult);
    }
}

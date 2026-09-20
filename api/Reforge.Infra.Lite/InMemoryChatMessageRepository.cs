using Reforge.Domain;
using Reforge.Core.Chat.Domain;
using Reforge.Core.Chat.OutputPorts;

namespace Reforge.Infra.Lite;

// Registered as a Singleton (see ServiceRegistration.AddLiteInfrastructure) so state survives
// across requests for the lifetime of the reforge-api-lite process — mirrors the other
// in-memory repositories.
public class InMemoryChatMessageRepository : IChatMessageRepository
{
    private readonly List<ChatMessage> _messages = [];
    private readonly Lock _lock = new();

    public Task<List<ChatMessage>> GetByUserIdAsync(UserId userId)
    {
        lock (_lock)
        {
            return Task.FromResult(_messages
                .Where(m => m.UserId == userId)
                .OrderBy(m => m.Timestamp)
                .ToList());
        }
    }

    public Task AddAsync(ChatMessage message)
    {
        lock (_lock) _messages.Add(message);
        return Task.CompletedTask;
    }
}

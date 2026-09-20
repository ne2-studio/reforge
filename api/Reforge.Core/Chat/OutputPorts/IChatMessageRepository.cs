using Reforge.Domain;
using Reforge.Core.Chat.Domain;

namespace Reforge.Core.Chat.OutputPorts;

public interface IChatMessageRepository
{
    /// <summary>The caller's own chat messages, oldest first (by Timestamp ascending) — mirrors
    /// the source backend's chat_repository.getChatHistory ordering, which the system-prompt
    /// construction and the /chat-history response both rely on.</summary>
    Task<List<ChatMessage>> GetByUserIdAsync(UserId userId);

    Task AddAsync(ChatMessage message);
}

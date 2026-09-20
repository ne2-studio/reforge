using Reforge.Domain;

namespace Reforge.Core.Chat.Domain;

// Ports the source recomp-coach-backend's chat_messages table (see
// recomp-coach-backend/supabase/functions/server/repositories/chat_repository.ts): one row per
// user/assistant exchange, not one row per message — UserMessage and AssistantMessage are always
// written together, at the end of a single ChatManager.SendMessageAsync call (see that doc
// comment for why the AI call itself isn't wrapped in the same DB transaction as the write). A
// user has many chat messages — Id is a server-generated surrogate key, UserId is a plain
// foreign-key-shaped field, same technique as Meal/Workout.
public sealed class ChatMessage
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public string UserMessage { get; }
    public string AssistantMessage { get; }
    public DateTime Timestamp { get; }

    public ChatMessage(Guid id, UserId userId, string userMessage, string assistantMessage, DateTime timestamp)
    {
        Id = id;
        UserId = userId;
        UserMessage = userMessage;
        AssistantMessage = assistantMessage;
        Timestamp = timestamp;
    }
}

using Reforge.Core.Shared;

namespace Reforge.Core.Chat;

/// <summary>
/// Slice 8 (docs/plan/02-vertical-slices.md): the AI coach chat. Ports recomp-coach-backend's
/// routes/chat.ts — system-prompt construction from the caller's profile/today's meals/closed-day
/// status/recent meal history/recent chat history, the "cerrar mi día" special command (delegated
/// to IClosedDaysUseCase.CloseDayAsync rather than duplicating that logic — see that interface's
/// doc comment), and chat message persistence. Both verbs resolve the caller's identity
/// themselves via ICurrentUserProvider; it is never a parameter here. Slice 9 adds the Free-tier monthly
/// usage limit for SendMessageAsync — see ChatManager and
/// Reforge.Core.Subscriptions.ISubscriptionsUseCase.
/// </summary>
public interface IChatUseCase
{
    /// <summary>Sends a message to the AI coach and returns its reply. Persists both the user's
    /// message and the assistant's reply as one ChatMessage. If the reply is the special
    /// "cerrar mi día" command, closes today (via IClosedDaysUseCase.CloseDayAsync) and returns a
    /// Spanish success/already-closed/no-meals message instead of the literal command.</summary>
    Task<Result<string>> SendMessageAsync(SendChatMessageRequestDto request);

    /// <summary>The caller's own chat history, oldest first.</summary>
    Task<Result<List<ChatMessageDto>>> GetChatHistoryAsync();
}

public record SendChatMessageRequestDto(string Message);

// Wraps the bare reply string: an OkObjectResult(string) is rendered as text/plain by ASP.NET's
// default output formatter regardless of Accept header, unlike every other endpoint here, which
// returns a JSON object.
public record SendChatMessageResponseDto(string Reply);

public record ChatMessageDto(Guid Id, string UserMessage, string AssistantMessage, DateTime Timestamp);

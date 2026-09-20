import { api } from '@/api';
import { useCoachStore } from '@/store/coachStore';
import { ChatMessage } from '@/types';

// Orchestration layer for the AI coach chat — see docs/architecture/frontend.md's `useCases/`
// layer. Each function calls api.coach.*, then writes the result into coachStore; ChatRoute
// reads the store's state and calls these for anything mutating. Mirrors
// features/meals/useCases/index.ts's error-handling/store-update pattern.

export async function loadChatHistory(): Promise<void> {
  useCoachStore.setState({ isLoading: true, error: null });
  try {
    const messages = await api.coach.getChatHistory();
    useCoachStore.setState({ messages, isLoading: false });
  } catch (error) {
    useCoachStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar el historial del coach',
      isLoading: false,
    });
  }
}

// Sends a message, then appends the resulting turn (user message + assistant reply) to the
// store's messages — the backend returns only the reply, not the full ChatMessageDto, so the
// timestamp/id here are client-side and best-effort, replaced with the server's own values the
// next time loadChatHistory() runs (e.g. on a fresh mount of /chat).
export async function sendChatMessage(message: string): Promise<void> {
  useCoachStore.setState({ isLoading: true, error: null });
  try {
    const reply = await api.coach.sendMessage(message);
    const turn = new ChatMessage({
      id: crypto.randomUUID(),
      userMessage: message,
      assistantMessage: reply,
      timestamp: new Date().toISOString(),
    });
    useCoachStore.setState((state) => ({ messages: [...state.messages, turn], isLoading: false }));
  } catch (error) {
    useCoachStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo enviar el mensaje al coach',
      isLoading: false,
    });
    throw error;
  }
}

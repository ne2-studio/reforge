import { get, post } from '../http';
import { ChatMessage, type ChatMessageDtoShape } from '../../types';

// Wire shape of api/Reforge.Core/Chat/IChatUseCase.cs's SendChatMessageResponseDto — only used
// here to unwrap the bare `reply` string; there's no dedicated types/index.ts entry for it
// since nothing else in this codebase needs the wrapper shape itself, just the string inside.
interface SendChatMessageResponseDtoShape {
  reply: string;
}

export const coachApi = {
  // POST /api/chat — sends a message to the AI coach and returns its reply. Unwraps
  // `{ reply }` to a bare string since that's the only field this response ever carries.
  async sendMessage(message: string): Promise<string> {
    const data = await post<SendChatMessageResponseDtoShape>('/api/chat', { message });
    return data.reply;
  },

  // GET /api/chat-history — the caller's own chat history, oldest first.
  async getChatHistory(): Promise<ChatMessage[]> {
    const data = await get<ChatMessageDtoShape[]>('/api/chat-history');
    return data.map((message) => new ChatMessage(message));
  },
};

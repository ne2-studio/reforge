import { Message } from "../types";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export interface ChatResponse {
  messages: Message[];
}

export interface SendMessageResponse {
  reply: string;
}

export const coachService = {
  async getChatHistory(accessToken: string): Promise<ChatResponse> {
    const response = await fetch(`${BASE_URL}/chat-history`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load chat history: ${response.status}`);
    }

    return response.json();
  },

  async sendMessage(
    accessToken: string,
    message: string,
    context?: {
      todaysMeals?: any[];
      dailyMenu?: any;
    }
  ): Promise<SendMessageResponse> {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message,
        ...context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to send message: ${response.status}`);
    }

    return response.json();
  },

  async saveAnalysis(accessToken: string, date: string, analysis: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/save-coach-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        date,
        analysis,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to save coach analysis: ${response.status}`);
    }
  }
};

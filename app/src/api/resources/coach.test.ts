// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic — same reasoning as
// meals.test.ts.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn() };
});

import { get, post } from '../http';
import { coachApi } from './coach';

const chatMessageDto = {
  id: 'msg-1',
  userMessage: '¿Qué debería desayunar hoy?',
  assistantMessage: 'Prueba con huevos revueltos y aguacate.',
  timestamp: '2026-01-01T08:00:00.000Z',
};

describe('coachApi', () => {
  it('sendMessage posts to /api/chat and unwraps the reply string', async () => {
    vi.mocked(post).mockResolvedValue({ reply: 'Prueba con huevos revueltos y aguacate.' });

    const reply = await coachApi.sendMessage('¿Qué debería desayunar hoy?');

    expect(post).toHaveBeenCalledWith('/api/chat', { message: '¿Qué debería desayunar hoy?' });
    expect(reply).toBe('Prueba con huevos revueltos y aguacate.');
  });

  it('getChatHistory hydrates ChatMessage instances from GET /api/chat-history', async () => {
    vi.mocked(get).mockResolvedValue([chatMessageDto]);

    const history = await coachApi.getChatHistory();

    expect(get).toHaveBeenCalledWith('/api/chat-history');
    expect(history).toHaveLength(1);
    expect(history[0].userMessage).toBe('¿Qué debería desayunar hoy?');
    expect(history[0].timestamp).toBeInstanceOf(Date);
  });
});

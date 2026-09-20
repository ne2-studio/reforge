// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoachChat } from './CoachChat';
import { ChatMessage } from '@/types';

const messages = [
  new ChatMessage({
    id: 'msg-1',
    userMessage: '¿Qué debería desayunar hoy?',
    assistantMessage: 'Prueba con huevos revueltos y aguacate.',
    timestamp: '2026-01-08T08:00:00.000Z',
  }),
];

describe('CoachChat', () => {
  it('shows suggested questions on the empty state', () => {
    render(<CoachChat messages={[]} isLoading={false} onSendMessage={vi.fn()} />);

    expect(screen.getByText('¡Hola! Soy tu coach')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '¿Qué debería desayunar hoy?' })).toBeInTheDocument();
  });

  it('renders past messages as user/assistant bubbles', () => {
    render(<CoachChat messages={messages} isLoading={false} onSendMessage={vi.fn()} />);

    expect(screen.getByText('¿Qué debería desayunar hoy?')).toBeInTheDocument();
    expect(screen.getByText('Prueba con huevos revueltos y aguacate.')).toBeInTheDocument();
  });

  it('sends the typed message and clears the input', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<CoachChat messages={[]} isLoading={false} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    await user.type(input, '¿Cómo voy hoy?');
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(onSendMessage).toHaveBeenCalledWith('¿Cómo voy hoy?');
    expect(input).toHaveValue('');
  });

  it('fills the input from a suggested question without sending it immediately', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<CoachChat messages={[]} isLoading={false} onSendMessage={onSendMessage} />);

    await user.click(screen.getByRole('button', { name: '¿Qué debería desayunar hoy?' }));

    expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toHaveValue('¿Qué debería desayunar hoy?');
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('disables input and send button while loading', () => {
    render(<CoachChat messages={messages} isLoading onSendMessage={vi.fn()} />);

    expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeDisabled();
  });
});

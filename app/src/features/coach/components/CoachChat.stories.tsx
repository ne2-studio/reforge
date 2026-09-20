import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CoachChat } from './CoachChat';
import { ChatMessage } from '@/types';

const messages = [
  new ChatMessage({
    id: 'msg-1',
    userMessage: '¿Qué debería desayunar hoy?',
    assistantMessage: 'Prueba con huevos revueltos, aguacate y una tostada integral.',
    timestamp: '2026-01-08T08:00:00.000Z',
  }),
];

const meta = {
  title: 'Features/Coach/CoachChat',
  component: CoachChat,
  args: {
    messages: [],
    isLoading: false,
    onSendMessage: fn(),
  },
} satisfies Meta<typeof CoachChat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithHistory: Story = {
  args: {
    messages,
  },
};

export const Loading: Story = {
  args: {
    messages,
    isLoading: true,
  },
};

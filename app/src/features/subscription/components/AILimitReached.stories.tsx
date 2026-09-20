import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AILimitReached } from './AILimitReached';

const meta = {
  title: 'Features/Subscription/AILimitReached',
  component: AILimitReached,
  args: {
    open: true,
    onOpenChange: fn(),
    feature: 'mealAnalysis',
    onUpgrade: fn(),
  },
} satisfies Meta<typeof AILimitReached>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MealAnalysisLimit: Story = {};

export const ChatMessagesLimit: Story = {
  args: {
    feature: 'chatMessages',
  },
};

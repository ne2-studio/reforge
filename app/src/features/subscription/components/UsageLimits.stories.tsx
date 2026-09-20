import type { Meta, StoryObj } from '@storybook/react-vite';
import { UsageLimits } from './UsageLimits';

const meta = {
  title: 'Features/Subscription/UsageLimits',
  component: UsageLimits,
  args: {
    mealAnalysis: { count: 3, limit: 10 },
    chatMessages: { count: 5, limit: 10 },
  },
} satisfies Meta<typeof UsageLimits>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PartiallyUsed: Story = {};

export const LimitReached: Story = {
  args: {
    mealAnalysis: { count: 10, limit: 10 },
    chatMessages: { count: 4, limit: 10 },
  },
};

export const Unused: Story = {
  args: {
    mealAnalysis: { count: 0, limit: 10 },
    chatMessages: { count: 0, limit: 10 },
  },
};

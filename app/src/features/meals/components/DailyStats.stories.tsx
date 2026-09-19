import type { Meta, StoryObj } from '@storybook/react-vite';
import { DailyStats } from './DailyStats';
import { DailyStats as DailyStatsData } from '@/types';

const dailyStats = new DailyStatsData({
  consumed: { calories: 1450, protein: 90, carbs: 140, fats: 40 },
  targets: { calories: 2200, protein: 140, carbs: 200, fats: 70 },
});

const meta = {
  title: 'Features/Meals/DailyStats',
  component: DailyStats,
  args: {
    dailyStats,
    isLoading: false,
  },
} satisfies Meta<typeof DailyStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Summary: Story = {};

export const Loading: Story = {
  args: {
    dailyStats: null,
    isLoading: true,
  },
};

export const NoProfileYet: Story = {
  args: {
    dailyStats: null,
    isLoading: false,
  },
};

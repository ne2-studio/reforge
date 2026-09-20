import type { Meta, StoryObj } from '@storybook/react-vite';
import { WeeklyProgress } from './WeeklyProgress';
import { WeeklyProgress as WeeklyProgressData } from '@/types';

const weeklyProgress = new WeeklyProgressData({
  days: [
    { date: '2026-01-02', targetCalories: 2200, consumedCalories: 2000, deficit: -200, mealsCount: 3 },
    { date: '2026-01-03', targetCalories: 2200, consumedCalories: 2500, deficit: 300, mealsCount: 2 },
    { date: '2026-01-04', targetCalories: 2200, consumedCalories: 2100, deficit: -100, mealsCount: 3 },
    { date: '2026-01-05', targetCalories: 2200, consumedCalories: 0, deficit: 0, mealsCount: 0 },
    { date: '2026-01-06', targetCalories: 2200, consumedCalories: 1900, deficit: -300, mealsCount: 4 },
    { date: '2026-01-07', targetCalories: 2200, consumedCalories: 2050, deficit: -150, mealsCount: 3 },
    { date: '2026-01-08', targetCalories: 2200, consumedCalories: 1800, deficit: -400, mealsCount: 2 },
  ],
  totalDeficit: -850,
  daysInDeficit: 5,
  daysInSurplus: 1,
  daysWithMeals: 6,
  adherenceStreak: 3,
  insights: [
    'Mantuviste el déficit calórico 5 de 7 días esta semana.',
    'Tu racha de adherencia actual es de 3 días.',
  ],
});

const meta = {
  title: 'Features/History/WeeklyProgress',
  component: WeeklyProgress,
  args: {
    weeklyProgress: null,
    isLoading: false,
  },
} satisfies Meta<typeof WeeklyProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithData: Story = {
  args: {
    weeklyProgress,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

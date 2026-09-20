import type { Meta, StoryObj } from '@storybook/react-vite';
import { DayHistory } from './DayHistory';
import { ClosedDay } from '@/types';

const days = [
  new ClosedDay({
    date: '2026-01-08',
    closedAt: '2026-01-08T22:00:00.000Z',
    totalCalories: 2100,
    mealsCount: 4,
    isTrainingDay: true,
    analysis: 'Buen día, mantuviste el déficit calórico y entrenaste.',
  }),
  new ClosedDay({
    date: '2026-01-07',
    closedAt: '2026-01-07T22:00:00.000Z',
    totalCalories: 2400,
    mealsCount: 3,
    isTrainingDay: false,
    analysis: 'Día de descanso, calorías por encima del objetivo.',
  }),
];

const meta = {
  title: 'Features/DayClose/DayHistory',
  component: DayHistory,
  args: {
    days: [],
    isLoading: false,
  },
} satisfies Meta<typeof DayHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithHistory: Story = {
  args: {
    days,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { WorkoutTracker } from './WorkoutTracker';
import { Workout } from '@/types';

const workouts = [
  new Workout({
    id: 'workout-1',
    type: 'strength',
    volume: 2500,
    duration: null,
    timestamp: '2026-01-01T13:00:00.000Z',
  }),
  new Workout({
    id: 'workout-2',
    type: 'cardio',
    volume: null,
    duration: 30,
    timestamp: '2026-01-02T08:00:00.000Z',
  }),
];

const meta = {
  title: 'Features/Workouts/WorkoutTracker',
  component: WorkoutTracker,
  args: {
    workouts: [],
    isLoading: false,
    isSaving: false,
    onLog: fn(),
  },
} satisfies Meta<typeof WorkoutTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithHistory: Story = {
  args: {
    workouts,
  },
};

export const Saving: Story = {
  args: {
    isSaving: true,
  },
};

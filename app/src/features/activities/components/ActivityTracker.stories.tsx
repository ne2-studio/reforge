import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ActivityTracker } from './ActivityTracker';
import { Activity } from '@/types';

const activities = [
  new Activity({
    id: 'activity-1',
    type: 'strength',
    duration: 45,
    steps: null,
    timestamp: '2026-01-01T13:00:00.000Z',
  }),
  new Activity({
    id: 'activity-2',
    type: 'cardio',
    duration: 30,
    steps: null,
    timestamp: '2026-01-02T08:00:00.000Z',
  }),
  new Activity({
    id: 'activity-3',
    type: 'neat',
    duration: null,
    steps: 8000,
    timestamp: '2026-01-03T20:00:00.000Z',
  }),
];

const meta = {
  title: 'Features/Activities/ActivityTracker',
  component: ActivityTracker,
  args: {
    activities: [],
    isLoading: false,
    isSaving: false,
    onLog: fn(),
  },
} satisfies Meta<typeof ActivityTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithHistory: Story = {
  args: {
    activities,
  },
};

export const Saving: Story = {
  args: {
    isSaving: true,
  },
};

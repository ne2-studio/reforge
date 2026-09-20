import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ProgressTracker } from './ProgressTracker';
import { Measurement, UserProfile } from '@/types';

const measurements = [
  new Measurement({ id: 'measurement-2', weight: 81.8, waist: 88, neck: 40, timestamp: '2026-01-08T08:00:00.000Z' }),
  new Measurement({ id: 'measurement-1', weight: 82.5, waist: 90, neck: 40, timestamp: '2026-01-01T08:00:00.000Z' }),
];

const profile = new UserProfile({
  age: 28,
  gender: 'male',
  height: 181,
  weight: 82.5,
  activityLevel: 'moderate',
  goal: 'lose-fat',
  trainingDays: null,
  trainingType: null,
  trainingTime: null,
  restrictions: null,
  calorieTarget: null,
  extraData: null,
  updatedAt: '2026-01-01T08:00:00.000Z',
});

const meta = {
  title: 'Features/Measurements/ProgressTracker',
  component: ProgressTracker,
  args: {
    measurements: [],
    profile: null,
    isLoading: false,
    isSaving: false,
    onLog: fn(),
  },
} satisfies Meta<typeof ProgressTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithHistory: Story = {
  args: {
    measurements,
  },
};

export const WithBodyComposition: Story = {
  args: {
    measurements,
    profile,
  },
};

export const Saving: Story = {
  args: {
    measurements,
    isSaving: true,
  },
};

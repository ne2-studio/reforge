import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ProfileEditor } from './ProfileEditor';
import { UserProfile } from '@/types';

const profile = new UserProfile({
  age: 30,
  gender: 'male',
  height: 180,
  weight: 80,
  activityLevel: 'moderate',
  goal: 'maintain',
  trainingDays: ['monday', 'wednesday', 'friday'],
  trainingType: 'strength',
  trainingTime: 'evening',
  restrictions: 'Sin lactosa',
  calorieTarget: 2500,
  extraData: {},
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const meta = {
  title: 'Features/Profile/ProfileEditor',
  component: ProfileEditor,
  args: {
    profile,
    isSaving: false,
    onSave: fn(),
  },
} satisfies Meta<typeof ProfileEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Summary: Story = {};

export const Saving: Story = {
  args: {
    isSaving: true,
  },
};

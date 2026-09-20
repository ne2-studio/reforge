import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ProfileEditor } from './ProfileEditor';
import { CustomReminder, ReminderSettings, UserProfile } from '@/types';

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
    reminderSettings: null,
    customReminders: [],
    isLoadingReminders: false,
    isSavingReminderSettings: false,
    onSaveReminderSettings: fn(),
    onCreateReminder: fn(),
    onUpdateReminder: fn(),
    onDeleteReminder: fn(),
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

export const WithReminders: Story = {
  args: {
    reminderSettings: new ReminderSettings({
      enabled: true,
      channel: 'push',
      defaultTime: '08:00',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    customReminders: [
      new CustomReminder({
        id: 'reminder-1',
        label: 'Registra tu cena',
        time: '20:00',
        daysOfWeek: ['monday', 'wednesday', 'friday'],
        enabled: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ],
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ReminderSettingsCard } from './ReminderSettingsCard';
import { CustomReminder, ReminderSettings } from '@/types';

const settings = new ReminderSettings({
  enabled: true,
  channel: 'push',
  defaultTime: '08:00',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const customReminders = [
  new CustomReminder({
    id: 'reminder-1',
    label: 'Registra tu cena',
    time: '20:00',
    daysOfWeek: ['monday', 'wednesday', 'friday'],
    enabled: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
  new CustomReminder({
    id: 'reminder-2',
    label: 'Pesa tus comidas',
    time: '13:00',
    daysOfWeek: ['saturday', 'sunday'],
    enabled: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
];

const meta = {
  title: 'Features/Profile/ReminderSettingsCard',
  component: ReminderSettingsCard,
  args: {
    settings: null,
    customReminders: [],
    isLoading: false,
    isSavingSettings: false,
    onSaveSettings: fn(),
    onCreateReminder: fn(),
    onUpdateReminder: fn(),
    onDeleteReminder: fn(),
  },
} satisfies Meta<typeof ReminderSettingsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSettingsYet: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithCustomReminders: Story = {
  args: {
    settings,
    customReminders,
  },
};

export const Saving: Story = {
  args: {
    settings,
    customReminders,
    isSavingSettings: true,
  },
};

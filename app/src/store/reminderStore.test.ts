import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReminderStore } from './reminderStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    reminders: {
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      getCustomReminders: vi.fn(),
      createCustomReminder: vi.fn(),
      updateCustomReminder: vi.fn(),
      deleteCustomReminder: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import {
  createCustomReminder,
  deleteCustomReminder,
  loadCustomReminders,
  loadReminderSettings,
  saveReminderSettings,
  updateCustomReminder,
} from '@/features/profile/useCases';
import { CustomReminder, ReminderSettings } from '@/types';

const settingsDto = { enabled: true, channel: 'push', defaultTime: '08:00', updatedAt: '2026-01-01T08:00:00.000Z' };
const reminderDto = {
  id: 'reminder-1',
  label: 'Registra tu cena',
  time: '20:00',
  daysOfWeek: ['monday'],
  enabled: true,
  updatedAt: '2026-01-01T08:00:00.000Z',
};

describe('reminderStore + profile useCases (reminders)', () => {
  beforeEach(() => {
    useReminderStore.setState({
      settings: null,
      customReminders: [],
      isLoading: false,
      isSavingSettings: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('loadReminderSettings populates the store on success', async () => {
    vi.mocked(api.reminders.getSettings).mockResolvedValue(new ReminderSettings(settingsDto));

    await loadReminderSettings();

    const state = useReminderStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.settings?.channel).toBe('push');
  });

  it('loadReminderSettings records an error and leaves settings null on a 404/failure', async () => {
    vi.mocked(api.reminders.getSettings).mockRejectedValue(new Error('not found'));

    await loadReminderSettings();

    const state = useReminderStore.getState();
    expect(state.settings).toBeNull();
    expect(state.error).toBe('not found');
    expect(state.isLoading).toBe(false);
  });

  it('saveReminderSettings saves and updates the store', async () => {
    vi.mocked(api.reminders.updateSettings).mockResolvedValue(new ReminderSettings(settingsDto));

    await saveReminderSettings({ enabled: true, channel: 'push', defaultTime: '08:00' });

    expect(api.reminders.updateSettings).toHaveBeenCalledWith({ enabled: true, channel: 'push', defaultTime: '08:00' });
    const state = useReminderStore.getState();
    expect(state.settings?.enabled).toBe(true);
    expect(state.isSavingSettings).toBe(false);
  });

  it('saveReminderSettings records an error and rethrows on failure', async () => {
    vi.mocked(api.reminders.updateSettings).mockRejectedValue(new Error('save failed'));

    await expect(
      saveReminderSettings({ enabled: true, channel: 'push', defaultTime: '08:00' })
    ).rejects.toThrow('save failed');

    expect(useReminderStore.getState().error).toBe('save failed');
  });

  it('loadCustomReminders populates the store on success', async () => {
    vi.mocked(api.reminders.getCustomReminders).mockResolvedValue([new CustomReminder(reminderDto)]);

    await loadCustomReminders();

    expect(useReminderStore.getState().customReminders).toHaveLength(1);
  });

  it('createCustomReminder appends the saved reminder to the store', async () => {
    vi.mocked(api.reminders.createCustomReminder).mockResolvedValue(new CustomReminder(reminderDto));

    await createCustomReminder({ label: 'Registra tu cena', time: '20:00', daysOfWeek: ['monday'], enabled: true });

    expect(useReminderStore.getState().customReminders).toHaveLength(1);
  });

  it('updateCustomReminder replaces the matching reminder in the store', async () => {
    useReminderStore.setState({ customReminders: [new CustomReminder(reminderDto)] });
    const updated = new CustomReminder({ ...reminderDto, label: 'Registra tu almuerzo' });
    vi.mocked(api.reminders.updateCustomReminder).mockResolvedValue(updated);

    await updateCustomReminder('reminder-1', {
      label: 'Registra tu almuerzo',
      time: '13:00',
      daysOfWeek: ['tuesday'],
      enabled: false,
    });

    const state = useReminderStore.getState();
    expect(state.customReminders).toHaveLength(1);
    expect(state.customReminders[0].label).toBe('Registra tu almuerzo');
  });

  it('deleteCustomReminder removes the reminder from the store', async () => {
    useReminderStore.setState({ customReminders: [new CustomReminder(reminderDto)] });
    vi.mocked(api.reminders.deleteCustomReminder).mockResolvedValue(undefined);

    await deleteCustomReminder('reminder-1');

    expect(useReminderStore.getState().customReminders).toHaveLength(0);
  });

  it('reset clears the store back to its initial state', () => {
    useReminderStore.setState({
      settings: new ReminderSettings(settingsDto),
      customReminders: [new CustomReminder(reminderDto)],
      isLoading: true,
      isSavingSettings: true,
      error: 'x',
    });

    useReminderStore.getState().reset();

    expect(useReminderStore.getState()).toMatchObject({
      settings: null,
      customReminders: [],
      isLoading: false,
      isSavingSettings: false,
      error: null,
    });
  });
});

// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() };
});

import { get, post, put, del } from '../http';
import { remindersApi } from './reminders';

const settingsDto = {
  enabled: true,
  channel: 'push',
  defaultTime: '08:00',
  updatedAt: '2026-01-01T08:00:00.000Z',
};

const customReminderDto = {
  id: 'reminder-1',
  label: 'Registra tu cena',
  time: '20:00',
  daysOfWeek: ['monday', 'wednesday', 'friday'],
  enabled: true,
  updatedAt: '2026-01-01T08:00:00.000Z',
};

describe('remindersApi', () => {
  it('getSettings hydrates a ReminderSettings instance from GET /api/reminder-settings', async () => {
    vi.mocked(get).mockResolvedValue(settingsDto);

    const settings = await remindersApi.getSettings();

    expect(get).toHaveBeenCalledWith('/api/reminder-settings');
    expect(settings.enabled).toBe(true);
    expect(settings.channel).toBe('push');
    expect(settings.defaultTime).toBe('08:00');
  });

  it('updateSettings puts to /api/reminder-settings and hydrates the response', async () => {
    vi.mocked(put).mockResolvedValue(settingsDto);

    const settings = await remindersApi.updateSettings({ enabled: true, channel: 'push', defaultTime: '08:00' });

    expect(put).toHaveBeenCalledWith('/api/reminder-settings', {
      enabled: true,
      channel: 'push',
      defaultTime: '08:00',
    });
    expect(settings.channel).toBe('push');
  });

  it('getCustomReminders hydrates CustomReminder instances from GET /api/custom-reminders', async () => {
    vi.mocked(get).mockResolvedValue([customReminderDto]);

    const reminders = await remindersApi.getCustomReminders();

    expect(get).toHaveBeenCalledWith('/api/custom-reminders');
    expect(reminders).toHaveLength(1);
    expect(reminders[0].label).toBe('Registra tu cena');
    expect(reminders[0].daysOfWeek).toEqual(['monday', 'wednesday', 'friday']);
  });

  it('createCustomReminder posts to /api/custom-reminders and hydrates the response', async () => {
    vi.mocked(post).mockResolvedValue(customReminderDto);

    const reminder = await remindersApi.createCustomReminder({
      label: 'Registra tu cena',
      time: '20:00',
      daysOfWeek: ['monday', 'wednesday', 'friday'],
      enabled: true,
    });

    expect(post).toHaveBeenCalledWith('/api/custom-reminders', {
      label: 'Registra tu cena',
      time: '20:00',
      daysOfWeek: ['monday', 'wednesday', 'friday'],
      enabled: true,
    });
    expect(reminder.id).toBe('reminder-1');
  });

  it('updateCustomReminder puts to /api/custom-reminders/{id} and hydrates the response', async () => {
    vi.mocked(put).mockResolvedValue(customReminderDto);

    const reminder = await remindersApi.updateCustomReminder('reminder-1', {
      label: 'Registra tu cena',
      time: '20:00',
      daysOfWeek: ['monday'],
      enabled: false,
    });

    expect(put).toHaveBeenCalledWith('/api/custom-reminders/reminder-1', {
      label: 'Registra tu cena',
      time: '20:00',
      daysOfWeek: ['monday'],
      enabled: false,
    });
    expect(reminder.id).toBe('reminder-1');
  });

  it('deleteCustomReminder deletes /api/custom-reminders/{id}', async () => {
    vi.mocked(del).mockResolvedValue(undefined);

    await remindersApi.deleteCustomReminder('reminder-1');

    expect(del).toHaveBeenCalledWith('/api/custom-reminders/reminder-1');
  });
});

import { get, post, put, del } from '../http';
import {
  ReminderSettings,
  type ReminderSettingsDtoShape,
  type SaveReminderSettingsData,
  CustomReminder,
  type CustomReminderDtoShape,
  type SaveCustomReminderData,
} from '../../types';

export const remindersApi = {
  // GET /api/reminder-settings — throws a 404 ApiError (via handleResponse) before the
  // caller's first save, same shape as profileApi.getProfile.
  async getSettings(): Promise<ReminderSettings> {
    const data = await get<ReminderSettingsDtoShape>('/api/reminder-settings');
    return new ReminderSettings(data);
  },

  // PUT /api/reminder-settings — inserts or fully replaces the caller's settings.
  async updateSettings(data: SaveReminderSettingsData): Promise<ReminderSettings> {
    const saved = await put<ReminderSettingsDtoShape>('/api/reminder-settings', data);
    return new ReminderSettings(saved);
  },

  // GET /api/custom-reminders — the caller's own custom reminders.
  async getCustomReminders(): Promise<CustomReminder[]> {
    const data = await get<CustomReminderDtoShape[]>('/api/custom-reminders');
    return data.map((reminder) => new CustomReminder(reminder));
  },

  // POST /api/custom-reminders — always a create. Returns the saved reminder.
  async createCustomReminder(data: SaveCustomReminderData): Promise<CustomReminder> {
    const saved = await post<CustomReminderDtoShape>('/api/custom-reminders', data);
    return new CustomReminder(saved);
  },

  // PUT /api/custom-reminders/{id} — fully replaces one of the caller's own reminders.
  async updateCustomReminder(id: string, data: SaveCustomReminderData): Promise<CustomReminder> {
    const saved = await put<CustomReminderDtoShape>(`/api/custom-reminders/${id}`, data);
    return new CustomReminder(saved);
  },

  // DELETE /api/custom-reminders/{id}.
  async deleteCustomReminder(id: string): Promise<void> {
    await del<void>(`/api/custom-reminders/${id}`);
  },
};

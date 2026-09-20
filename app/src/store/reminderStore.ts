import { create } from 'zustand';
import { CustomReminder, ReminderSettings } from '../types';

interface ReminderState {
  settings: ReminderSettings | null;
  customReminders: CustomReminder[];
  isLoading: boolean;
  isSavingSettings: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for reminders — see docs/architecture/frontend.md's `store/` layer. Its only
// consumer is the Recordatorios section of /perfil (features/profile), but it's its own store
// rather than folded into profileStore since reminders are an independent backend feature with
// their own DTOs/endpoints (Slice 6). `settings: null` doubles as "not loaded yet" and "no
// settings saved" (a 404 from GET, a normal state before the caller has ever visited the
// section) — same pattern as profileStore.
export const useReminderStore = create<ReminderState>((set) => ({
  settings: null,
  customReminders: [],
  isLoading: false,
  isSavingSettings: false,
  error: null,
  reset: () => set({ settings: null, customReminders: [], isLoading: false, isSavingSettings: false, error: null }),
}));

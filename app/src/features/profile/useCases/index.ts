import { api } from '@/api';
import { useProfileStore } from '@/store/profileStore';
import { useReminderStore } from '@/store/reminderStore';
import type { SaveCustomReminderData, SaveProfileData, SaveReminderSettingsData } from '@/types';

// Orchestration layer for the profile feature — see docs/architecture/frontend.md's
// `useCases/` layer. Each function calls api.profile.*, then writes the result into
// profileStore; ProfileRoute reads the store's state and calls these for anything mutating.

export async function loadProfile(): Promise<void> {
  useProfileStore.setState({ isLoading: true, error: null });
  try {
    // null here means "no profile saved yet" (404), not a failure — see profileApi.getProfile.
    const profile = await api.profile.getProfile();
    useProfileStore.setState({ profile, isLoading: false });
  } catch (error) {
    useProfileStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar el perfil',
      isLoading: false,
    });
  }
}

export async function submitProfile(data: SaveProfileData): Promise<void> {
  useProfileStore.setState({ isLoading: true, error: null });
  try {
    const profile = await api.profile.saveProfile(data);
    useProfileStore.setState({ profile, isLoading: false });
  } catch (error) {
    useProfileStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo guardar el perfil',
      isLoading: false,
    });
    throw error;
  }
}

// Orchestration for the Recordatorios section of the profile screen (Slice 6, see
// docs/plan/02-vertical-slices.md) — kept alongside the profile useCases rather than in their
// own feature module since there's no standalone reminders route, only a section rendered from
// ProfileEditor.tsx. Writes go to reminderStore, a separate domain store from profileStore
// (see docs/architecture/frontend.md's `store/` layer), since reminders are their own backend
// feature with their own DTOs/endpoints.

export async function loadReminderSettings(): Promise<void> {
  useReminderStore.setState({ isLoading: true, error: null });
  try {
    // null here means "no settings saved yet" (404), not a failure — mirrors loadProfile.
    const settings = await api.reminders.getSettings();
    useReminderStore.setState({ settings, isLoading: false });
  } catch (error) {
    useReminderStore.setState({
      settings: null,
      error: error instanceof Error ? error.message : 'No se pudieron cargar los recordatorios',
      isLoading: false,
    });
  }
}

export async function saveReminderSettings(data: SaveReminderSettingsData): Promise<void> {
  useReminderStore.setState({ isSavingSettings: true, error: null });
  try {
    const settings = await api.reminders.updateSettings(data);
    useReminderStore.setState({ settings, isSavingSettings: false });
  } catch (error) {
    useReminderStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo guardar la configuración de recordatorios',
      isSavingSettings: false,
    });
    throw error;
  }
}

export async function loadCustomReminders(): Promise<void> {
  try {
    const customReminders = await api.reminders.getCustomReminders();
    useReminderStore.setState({ customReminders });
  } catch (error) {
    useReminderStore.setState({
      error: error instanceof Error ? error.message : 'No se pudieron cargar los recordatorios',
    });
  }
}

export async function createCustomReminder(data: SaveCustomReminderData): Promise<void> {
  try {
    const reminder = await api.reminders.createCustomReminder(data);
    useReminderStore.setState((state) => ({ customReminders: [...state.customReminders, reminder] }));
  } catch (error) {
    useReminderStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo guardar el recordatorio',
    });
    throw error;
  }
}

export async function updateCustomReminder(id: string, data: SaveCustomReminderData): Promise<void> {
  try {
    const reminder = await api.reminders.updateCustomReminder(id, data);
    useReminderStore.setState((state) => ({
      customReminders: state.customReminders.map((r) => (r.id === id ? reminder : r)),
    }));
  } catch (error) {
    useReminderStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo actualizar el recordatorio',
    });
    throw error;
  }
}

export async function deleteCustomReminder(id: string): Promise<void> {
  try {
    await api.reminders.deleteCustomReminder(id);
    useReminderStore.setState((state) => ({
      customReminders: state.customReminders.filter((r) => r.id !== id),
    }));
  } catch (error) {
    useReminderStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo eliminar el recordatorio',
    });
    throw error;
  }
}

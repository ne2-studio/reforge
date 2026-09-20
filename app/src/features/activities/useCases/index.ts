import { api } from '@/api';
import { useActivityStore } from '@/store/activityStore';
import type { LogActivityData } from '@/types';

// Orchestration layer for the activities feature — see docs/architecture/frontend.md's
// `useCases/` layer. Each function calls api.activities.*, then writes the result into
// activityStore; ActivityRoute reads the store's state and calls these for anything mutating.

export async function loadActivities(): Promise<void> {
  useActivityStore.setState({ isLoading: true, error: null });
  try {
    const activities = await api.activities.getActivities();
    useActivityStore.setState({ activities, isLoading: false });
  } catch (error) {
    useActivityStore.setState({
      error: error instanceof Error ? error.message : 'No se pudieron cargar las actividades',
      isLoading: false,
    });
  }
}

// Saves an activity and prepends it to the store's activities — GET /api/activities is already
// most-recent-first, so a prepend keeps the store's ordering matching the backend's.
export async function logActivity(data: LogActivityData): Promise<void> {
  useActivityStore.setState({ isLoading: true, error: null });
  try {
    const activity = await api.activities.logActivity(data);
    useActivityStore.setState((state) => ({ activities: [activity, ...state.activities], isLoading: false }));
  } catch (error) {
    useActivityStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo registrar la actividad',
      isLoading: false,
    });
    throw error;
  }
}

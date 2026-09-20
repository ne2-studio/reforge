import { api } from '@/api';
import { useClosedDaysStore } from '@/store/closedDaysStore';

// Orchestration layer for the day-close feature — see docs/architecture/frontend.md's
// `useCases/` layer. Each function calls api.closedDays.*, then writes the result into
// closedDaysStore; HistoryRoute reads the store's state and calls these for anything mutating.

export async function loadDayHistory(): Promise<void> {
  useClosedDaysStore.setState({ isLoading: true, error: null });
  try {
    const dayHistory = await api.closedDays.getDayHistory();
    useClosedDaysStore.setState({ dayHistory, isLoading: false });
  } catch (error) {
    useClosedDaysStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar el historial de días',
      isLoading: false,
    });
  }
}

export async function loadWeeklyProgress(): Promise<void> {
  useClosedDaysStore.setState({ isLoading: true, error: null });
  try {
    const weeklyProgress = await api.closedDays.getWeeklyProgress();
    useClosedDaysStore.setState({ weeklyProgress, isLoading: false });
  } catch (error) {
    useClosedDaysStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar el progreso semanal',
      isLoading: false,
    });
  }
}

// Closes today, then re-loads day-history + weekly-progress so both tabs reflect the close
// immediately. Throws/propagates its error like meals/useCases's logMeal — HistoryRoute is the
// one that toasts it (e.g. the backend's own "already closed"/"no meals logged" 400s), rather
// than swallowing it into the store's `error` field the way the read-only loaders above do.
export async function closeDay(): Promise<void> {
  try {
    await api.closedDays.closeDay();
    await Promise.all([loadDayHistory(), loadWeeklyProgress()]);
  } catch (error) {
    throw error instanceof Error ? error : new Error('No se pudo cerrar el día');
  }
}

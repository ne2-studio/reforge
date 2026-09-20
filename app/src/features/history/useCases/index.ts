import { api } from '@/api';
import { useWeeklyProgressStore } from '@/store/weeklyProgressStore';

// Orchestration layer for the history feature — see docs/architecture/frontend.md's
// `useCases/` layer. Calls api.weeklyProgress.*, then writes the result into
// weeklyProgressStore; HistoryRoute reads the store's state.

export async function loadWeeklyProgress(): Promise<void> {
  useWeeklyProgressStore.setState({ isLoading: true, error: null });
  try {
    const weeklyProgress = await api.weeklyProgress.getWeeklyProgress();
    useWeeklyProgressStore.setState({ weeklyProgress, isLoading: false });
  } catch (error) {
    useWeeklyProgressStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar el progreso semanal',
      isLoading: false,
    });
  }
}

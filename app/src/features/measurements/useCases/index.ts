import { api } from '@/api';
import { useMeasurementStore } from '@/store/measurementStore';
import { useWeeklyProgressStore } from '@/store/weeklyProgressStore';
import type { LogMeasurementData } from '@/types';

// Orchestration layer for the measurements feature — see docs/architecture/frontend.md's
// `useCases/` layer. Each function calls api.measurements.* or api.weeklyProgress.*, then
// writes the result into measurementStore/weeklyProgressStore; ProgressRoute reads the
// stores' state and calls these for anything mutating.

export async function loadMeasurements(): Promise<void> {
  useMeasurementStore.setState({ isLoading: true, error: null });
  try {
    const measurements = await api.measurements.getMeasurements();
    useMeasurementStore.setState({ measurements, isLoading: false });
  } catch (error) {
    useMeasurementStore.setState({
      error: error instanceof Error ? error.message : 'No se pudieron cargar las medidas',
      isLoading: false,
    });
  }
}

// Saves a measurement and prepends it to the store's measurements — GET /api/measurements is
// already most-recent-first, so a prepend keeps the store's ordering matching the backend's.
export async function logMeasurement(data: LogMeasurementData): Promise<void> {
  useMeasurementStore.setState({ isLoading: true, error: null });
  try {
    const measurement = await api.measurements.logMeasurement(data);
    useMeasurementStore.setState((state) => ({
      measurements: [measurement, ...state.measurements],
      isLoading: false,
    }));
  } catch (error) {
    useMeasurementStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo guardar la medida',
      isLoading: false,
    });
    throw error;
  }
}

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

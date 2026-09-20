import { api } from '@/api';
import { useWorkoutStore } from '@/store/workoutStore';
import type { LogWorkoutData } from '@/types';

// Orchestration layer for the workouts feature — see docs/architecture/frontend.md's
// `useCases/` layer. Each function calls api.workouts.*, then writes the result into
// workoutStore; WorkoutRoute reads the store's state and calls these for anything mutating.

export async function loadWorkouts(): Promise<void> {
  useWorkoutStore.setState({ isLoading: true, error: null });
  try {
    const workouts = await api.workouts.getWorkouts();
    useWorkoutStore.setState({ workouts, isLoading: false });
  } catch (error) {
    useWorkoutStore.setState({
      error: error instanceof Error ? error.message : 'No se pudieron cargar los entrenamientos',
      isLoading: false,
    });
  }
}

// Saves a workout and prepends it to the store's workouts — GET /api/workouts is already
// most-recent-first, so a prepend keeps the store's ordering matching the backend's.
export async function logWorkout(data: LogWorkoutData): Promise<void> {
  useWorkoutStore.setState({ isLoading: true, error: null });
  try {
    const workout = await api.workouts.logWorkout(data);
    useWorkoutStore.setState((state) => ({ workouts: [workout, ...state.workouts], isLoading: false }));
  } catch (error) {
    useWorkoutStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo registrar el entreno',
      isLoading: false,
    });
    throw error;
  }
}

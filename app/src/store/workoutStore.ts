import { create } from 'zustand';
import { Workout } from '../types';

interface WorkoutState {
  workouts: Workout[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for workouts — see docs/architecture/frontend.md's `store/` layer. A single
// consumer today (WorkoutRoute), kept as its own store rather than folded into activityStore
// since workouts are an independent backend feature with its own DTOs (Slice 4).
export const useWorkoutStore = create<WorkoutState>((set) => ({
  workouts: [],
  isLoading: false,
  error: null,
  reset: () => set({ workouts: [], isLoading: false, error: null }),
}));

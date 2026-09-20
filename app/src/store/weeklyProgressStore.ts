import { create } from 'zustand';
import { WeeklyProgress } from '../types';

interface WeeklyProgressState {
  weeklyProgress: WeeklyProgress | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for weekly progress — see docs/architecture/frontend.md's `store/` layer.
// Read by ProgressRoute's "Resumen semanal" tab and by HomeRoute's summary, the same "shared,
// must survive navigation" reasoning as mealsStore/measurementStore.
export const useWeeklyProgressStore = create<WeeklyProgressState>((set) => ({
  weeklyProgress: null,
  isLoading: false,
  error: null,
  reset: () => set({ weeklyProgress: null, isLoading: false, error: null }),
}));

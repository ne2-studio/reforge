import { create } from 'zustand';
import { ClosedDay, WeeklyProgress } from '../types';

interface ClosedDaysState {
  dayHistory: ClosedDay[];
  weeklyProgress: WeeklyProgress | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for closed days — see docs/architecture/frontend.md's `store/` layer. Day
// history and weekly progress are both read by HistoryRoute's tabs and both need to reflect a
// freshly-closed day without a full reload, the same "shared, must survive navigation"
// reasoning as mealsStore/measurementStore.
export const useClosedDaysStore = create<ClosedDaysState>((set) => ({
  dayHistory: [],
  weeklyProgress: null,
  isLoading: false,
  error: null,
  reset: () => set({ dayHistory: [], weeklyProgress: null, isLoading: false, error: null }),
}));

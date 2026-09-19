import { create } from 'zustand';
import { Meal, DailyStats } from '../types';

interface MealsState {
  meals: Meal[];
  dailyStats: DailyStats | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for meals — see docs/architecture/frontend.md's `store/` layer. Meals is a
// genuine multi-consumer domain: MealLogger writes (via useCases/logMeal), DailyStats and
// MealsRoute's today's-meals list both read, and both need to reflect a newly-logged meal
// without a full page reload — the same "shared, must survive navigation" reasoning as
// profileStore, not the Route-may-call-api-directly exception.
//
// `dailyStats: null` doubles as "not loaded yet" and "no profile saved yet" (a 404 from GET,
// see mealsApi.getDailyStats) — useCases/index.ts's loadDailyStats() is the only place that
// tells those two apart, via isLoading.
export const useMealsStore = create<MealsState>((set) => ({
  meals: [],
  dailyStats: null,
  isLoading: false,
  error: null,
  reset: () => set({ meals: [], dailyStats: null, isLoading: false, error: null }),
}));

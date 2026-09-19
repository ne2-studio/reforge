import { api } from '@/api';
import { useMealsStore } from '@/store/mealsStore';
import type { SaveMealData } from '@/types';

// Orchestration layer for the meals feature — see docs/architecture/frontend.md's
// `useCases/` layer. Each function calls api.meals.*, then writes the result into
// mealsStore; MealsRoute reads the store's state and calls these for anything mutating.

// Local date, not UTC — a meal logged late at night should still land on "today" as the user
// experiences it. Matches the backend's DateOnly route param format (yyyy-MM-dd).
export function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function loadMeals(): Promise<void> {
  useMealsStore.setState({ isLoading: true, error: null });
  try {
    const meals = await api.meals.getMeals();
    useMealsStore.setState({ meals, isLoading: false });
  } catch (error) {
    useMealsStore.setState({
      error: error instanceof Error ? error.message : 'No se pudieron cargar las comidas',
      isLoading: false,
    });
  }
}

export async function loadDailyStats(date: string): Promise<void> {
  useMealsStore.setState({ isLoading: true, error: null });
  try {
    // null here means "no profile saved yet" (404), not a failure — see
    // mealsApi.getDailyStats.
    const dailyStats = await api.meals.getDailyStats(date);
    useMealsStore.setState({ dailyStats, isLoading: false });
  } catch (error) {
    useMealsStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar el resumen del día',
      isLoading: false,
    });
  }
}

// Saves a manual meal, prepends it to the store's meals (already most-recent-first, matching
// GET /meals's ordering), and refreshes today's daily-stats since a new meal changes it —
// the meal's own `date` is always today for manual entries (there's no past-dating UI in
// this slice), so today's stats are always the ones affected.
export async function logMeal(data: SaveMealData): Promise<void> {
  useMealsStore.setState({ isLoading: true, error: null });
  try {
    const meal = await api.meals.saveMeal(data);
    useMealsStore.setState((state) => ({ meals: [meal, ...state.meals], isLoading: false }));
    await loadDailyStats(todayDateString());
  } catch (error) {
    useMealsStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo guardar la comida',
      isLoading: false,
    });
    throw error;
  }
}

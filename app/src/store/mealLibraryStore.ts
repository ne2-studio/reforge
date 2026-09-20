import { create } from 'zustand';
import { MealLibraryItem } from '../types';

interface MealLibraryState {
  items: MealLibraryItem[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for the meal library — see docs/architecture/frontend.md's `store/` layer.
// A genuine multi-consumer domain: MealLibraryRoute reads/writes it, and MealsRoute's
// MealLogger integration reads `items` to populate its "cargar de biblioteca" picker without
// a second fetch — the same "shared, must survive navigation" reasoning as mealsStore.
export const useMealLibraryStore = create<MealLibraryState>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  reset: () => set({ items: [], isLoading: false, error: null }),
}));

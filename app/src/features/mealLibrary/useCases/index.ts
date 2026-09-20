import { api } from '@/api';
import { useMealLibraryStore } from '@/store/mealLibraryStore';
import type { SaveMealLibraryItemData } from '@/types';

// Orchestration layer for the meal library feature — see docs/architecture/frontend.md's
// `useCases/` layer. Each function calls api.mealLibrary.*, then writes the result into
// mealLibraryStore; MealLibraryRoute (and MealsRoute, for the "load/save from library"
// wiring) call these for anything mutating.

export async function loadLibrary(): Promise<void> {
  useMealLibraryStore.setState({ isLoading: true, error: null });
  try {
    const items = await api.mealLibrary.getLibrary();
    useMealLibraryStore.setState({ items, isLoading: false });
  } catch (error) {
    useMealLibraryStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar la biblioteca de comidas',
      isLoading: false,
    });
  }
}

// Saves a new library item and appends it to the store — GET /api/meal-library has no
// documented ordering guarantee to replicate, so a simple append is enough.
export async function saveToLibrary(data: SaveMealLibraryItemData): Promise<void> {
  try {
    const item = await api.mealLibrary.saveToLibrary(data);
    useMealLibraryStore.setState((state) => ({ items: [...state.items, item] }));
  } catch (error) {
    useMealLibraryStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo guardar en la biblioteca',
    });
    throw error;
  }
}

export async function deleteFromLibrary(id: string): Promise<void> {
  try {
    await api.mealLibrary.deleteFromLibrary(id);
    useMealLibraryStore.setState((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  } catch (error) {
    useMealLibraryStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo eliminar el elemento de la biblioteca',
    });
    throw error;
  }
}

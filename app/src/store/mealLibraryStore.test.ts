import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMealLibraryStore } from './mealLibraryStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    mealLibrary: {
      getLibrary: vi.fn(),
      saveToLibrary: vi.fn(),
      deleteFromLibrary: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadLibrary, saveToLibrary, deleteFromLibrary } from '@/features/mealLibrary/useCases';
import { MealLibraryItem, type SaveMealLibraryItemData } from '@/types';

const itemDto = {
  id: 'library-1',
  title: 'Pollo con arroz',
  description: 'Pechuga de pollo a la plancha con arroz blanco',
  category: 'lunch',
  calories: 600,
  protein: 50,
  carbs: 60,
  fats: 15,
};

describe('mealLibraryStore + mealLibrary useCases', () => {
  beforeEach(() => {
    useMealLibraryStore.setState({ items: [], isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadLibrary populates the store on success', async () => {
    vi.mocked(api.mealLibrary.getLibrary).mockResolvedValue([new MealLibraryItem(itemDto)]);

    await loadLibrary();

    const state = useMealLibraryStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].title).toBe('Pollo con arroz');
  });

  it('loadLibrary records an error message on failure', async () => {
    vi.mocked(api.mealLibrary.getLibrary).mockRejectedValue(new Error('network down'));

    await loadLibrary();

    const state = useMealLibraryStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('saveToLibrary saves and appends the item to the store', async () => {
    vi.mocked(api.mealLibrary.saveToLibrary).mockResolvedValue(new MealLibraryItem(itemDto));
    const payload: SaveMealLibraryItemData = {
      title: 'Pollo con arroz',
      description: 'Pechuga de pollo a la plancha con arroz blanco',
      category: 'lunch',
      calories: 600,
      protein: 50,
      carbs: 60,
      fats: 15,
    };

    await saveToLibrary(payload);

    expect(api.mealLibrary.saveToLibrary).toHaveBeenCalledWith(payload);
    const state = useMealLibraryStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('library-1');
  });

  it('saveToLibrary records an error and rethrows on failure', async () => {
    vi.mocked(api.mealLibrary.saveToLibrary).mockRejectedValue(new Error('save failed'));

    await expect(
      saveToLibrary({
        title: 'x',
        description: 'x',
        category: 'lunch',
        calories: 1,
        protein: 1,
        carbs: 1,
        fats: 1,
      })
    ).rejects.toThrow('save failed');

    expect(useMealLibraryStore.getState().error).toBe('save failed');
  });

  it('deleteFromLibrary deletes and removes the item from the store', async () => {
    useMealLibraryStore.setState({ items: [new MealLibraryItem(itemDto)] });
    vi.mocked(api.mealLibrary.deleteFromLibrary).mockResolvedValue(undefined);

    await deleteFromLibrary('library-1');

    expect(api.mealLibrary.deleteFromLibrary).toHaveBeenCalledWith('library-1');
    expect(useMealLibraryStore.getState().items).toHaveLength(0);
  });

  it('deleteFromLibrary records an error and rethrows on failure, leaving the item in place', async () => {
    useMealLibraryStore.setState({ items: [new MealLibraryItem(itemDto)] });
    vi.mocked(api.mealLibrary.deleteFromLibrary).mockRejectedValue(new Error('delete failed'));

    await expect(deleteFromLibrary('library-1')).rejects.toThrow('delete failed');

    const state = useMealLibraryStore.getState();
    expect(state.error).toBe('delete failed');
    expect(state.items).toHaveLength(1);
  });

  it('reset clears the store back to its initial state', () => {
    useMealLibraryStore.setState({
      items: [new MealLibraryItem(itemDto)],
      isLoading: true,
      error: 'x',
    });

    useMealLibraryStore.getState().reset();

    expect(useMealLibraryStore.getState()).toMatchObject({
      items: [],
      isLoading: false,
      error: null,
    });
  });
});

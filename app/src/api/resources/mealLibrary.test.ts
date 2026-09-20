// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn(), del: vi.fn() };
});

import { get, post, del } from '../http';
import { mealLibraryApi } from './mealLibrary';

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

describe('mealLibraryApi', () => {
  it('getLibrary hydrates MealLibraryItem instances from GET /api/meal-library', async () => {
    vi.mocked(get).mockResolvedValue([itemDto]);

    const items = await mealLibraryApi.getLibrary();

    expect(get).toHaveBeenCalledWith('/api/meal-library');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Pollo con arroz');
  });

  it('saveToLibrary posts to /api/meal-library and hydrates the response', async () => {
    vi.mocked(post).mockResolvedValue(itemDto);

    const item = await mealLibraryApi.saveToLibrary({
      title: 'Pollo con arroz',
      description: 'Pechuga de pollo a la plancha con arroz blanco',
      category: 'lunch',
      calories: 600,
      protein: 50,
      carbs: 60,
      fats: 15,
    });

    expect(post).toHaveBeenCalledWith(
      '/api/meal-library',
      expect.objectContaining({ title: 'Pollo con arroz', calories: 600 })
    );
    expect(item.id).toBe('library-1');
  });

  it('deleteFromLibrary sends DELETE to /api/meal-library/{id}', async () => {
    vi.mocked(del).mockResolvedValue(undefined);

    await mealLibraryApi.deleteFromLibrary('library-1');

    expect(del).toHaveBeenCalledWith('/api/meal-library/library-1');
  });
});

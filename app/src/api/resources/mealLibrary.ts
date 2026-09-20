import { get, post, del } from '../http';
import { MealLibraryItem, type MealLibraryItemDtoShape, type SaveMealLibraryItemData } from '../../types';

export const mealLibraryApi = {
  // GET /api/meal-library — the caller's own meal library items.
  async getLibrary(): Promise<MealLibraryItem[]> {
    const data = await get<MealLibraryItemDtoShape[]>('/api/meal-library');
    return data.map((item) => new MealLibraryItem(item));
  },

  // POST /api/meal-library — always a create, no edit use case (see
  // IMealLibraryUseCase.cs). Returns the saved item.
  async saveToLibrary(data: SaveMealLibraryItemData): Promise<MealLibraryItem> {
    const saved = await post<MealLibraryItemDtoShape>('/api/meal-library', data);
    return new MealLibraryItem(saved);
  },

  // DELETE /api/meal-library/{id}.
  async deleteFromLibrary(id: string): Promise<void> {
    await del<void>(`/api/meal-library/${id}`);
  },
};

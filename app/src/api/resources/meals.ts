import { get, post, isApiErrorWithStatus } from '../http';
import { Meal, DailyStats, type MealDtoShape, type SaveMealData, type DailyStatsDtoShape } from '../../types';

export const mealsApi = {
  // GET /api/meals — the caller's own meals, most recent first.
  async getMeals(): Promise<Meal[]> {
    const data = await get<MealDtoShape[]>('/api/meals');
    return data.map((meal) => new Meal(meal));
  },

  // POST /api/meals — saves a manually-entered meal. Returns the saved meal.
  async saveMeal(data: SaveMealData): Promise<Meal> {
    const saved = await post<MealDtoShape>('/api/meals', data);
    return new Meal(saved);
  },

  // GET /api/daily-stats/{date} — date as a YYYY-MM-DD string, matching the backend's
  // DateOnly route param. 404 (`{ "error": "..." }`) means the caller hasn't saved a profile
  // yet, so targets can't be computed — callers should treat that as "no stats yet" (see
  // MealsRoute), not surface it as a failure.
  async getDailyStats(date: string): Promise<DailyStats | null> {
    try {
      const data = await get<DailyStatsDtoShape>(`/api/daily-stats/${date}`);
      return new DailyStats(data);
    } catch (error) {
      if (isApiErrorWithStatus(error, 404)) return null;
      throw error;
    }
  },
};

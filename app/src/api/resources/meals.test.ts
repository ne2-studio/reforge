// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn() };
});

import { get, post, ApiError } from '../http';
import { mealsApi } from './meals';

const mealDto = {
  id: 'meal-1',
  mealText: 'Chicken and rice',
  category: 'lunch',
  time: '13:00',
  calories: 600,
  protein: 50,
  carbs: 60,
  fats: 15,
  feedback: null,
  extraData: {},
  timestamp: '2026-01-01T13:00:00.000Z',
  date: '2026-01-01',
};

const dailyStatsDto = {
  consumed: { calories: 600, protein: 50, carbs: 60, fats: 15 },
  targets: { calories: 2200, protein: 140, carbs: 200, fats: 70 },
};

describe('mealsApi', () => {
  it('getMeals hydrates Meal instances from GET /api/meals', async () => {
    vi.mocked(get).mockResolvedValue([mealDto]);

    const meals = await mealsApi.getMeals();

    expect(get).toHaveBeenCalledWith('/api/meals');
    expect(meals).toHaveLength(1);
    expect(meals[0].mealText).toBe('Chicken and rice');
    expect(meals[0].timestamp).toBeInstanceOf(Date);
  });

  it('saveMeal posts to /api/meals and hydrates the response', async () => {
    vi.mocked(post).mockResolvedValue(mealDto);

    const meal = await mealsApi.saveMeal({
      mealText: 'Chicken and rice',
      category: 'lunch',
      time: '13:00',
      calories: 600,
      protein: 50,
      carbs: 60,
      fats: 15,
      feedback: null,
      extraData: null,
    });

    expect(post).toHaveBeenCalledWith(
      '/api/meals',
      expect.objectContaining({ mealText: 'Chicken and rice', calories: 600 })
    );
    expect(meal.id).toBe('meal-1');
  });

  it('getDailyStats hydrates a DailyStats from GET /api/daily-stats/{date}', async () => {
    vi.mocked(get).mockResolvedValue(dailyStatsDto);

    const stats = await mealsApi.getDailyStats('2026-01-01');

    expect(get).toHaveBeenCalledWith('/api/daily-stats/2026-01-01');
    expect(stats?.consumed.calories).toBe(600);
    expect(stats?.targets.protein).toBe(140);
  });

  it('getDailyStats returns null when the backend reports 404 (no profile saved yet)', async () => {
    vi.mocked(get).mockRejectedValue(new ApiError(404, 'not found', { error: 'not found' }));

    const stats = await mealsApi.getDailyStats('2026-01-01');

    expect(stats).toBeNull();
  });

  it('getDailyStats rethrows non-404 errors', async () => {
    vi.mocked(get).mockRejectedValue(new ApiError(500, 'boom', { error: 'boom' }));

    await expect(mealsApi.getDailyStats('2026-01-01')).rejects.toThrow('boom');
  });
});

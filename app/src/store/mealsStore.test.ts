import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMealsStore } from './mealsStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    meals: {
      getMeals: vi.fn(),
      saveMeal: vi.fn(),
      getDailyStats: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadMeals, loadDailyStats, logMeal, todayDateString } from '@/features/meals/useCases';
import { Meal, DailyStats, type SaveMealData } from '@/types';

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

describe('mealsStore + meals useCases', () => {
  beforeEach(() => {
    useMealsStore.setState({ meals: [], dailyStats: null, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadMeals populates the store on success', async () => {
    vi.mocked(api.meals.getMeals).mockResolvedValue([new Meal(mealDto)]);

    await loadMeals();

    const state = useMealsStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.meals).toHaveLength(1);
    expect(state.meals[0].mealText).toBe('Chicken and rice');
  });

  it('loadMeals records an error message on failure', async () => {
    vi.mocked(api.meals.getMeals).mockRejectedValue(new Error('network down'));

    await loadMeals();

    const state = useMealsStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('loadDailyStats populates the store on success', async () => {
    vi.mocked(api.meals.getDailyStats).mockResolvedValue(new DailyStats(dailyStatsDto));

    await loadDailyStats('2026-01-01');

    expect(api.meals.getDailyStats).toHaveBeenCalledWith('2026-01-01');
    const state = useMealsStore.getState();
    expect(state.dailyStats?.consumed.calories).toBe(600);
    expect(state.error).toBeNull();
  });

  it('loadDailyStats treats a missing profile (null) as a normal state, not an error', async () => {
    vi.mocked(api.meals.getDailyStats).mockResolvedValue(null);

    await loadDailyStats('2026-01-01');

    const state = useMealsStore.getState();
    expect(state.dailyStats).toBeNull();
    expect(state.error).toBeNull();
  });

  it('logMeal saves, prepends the meal to the store, and refreshes daily-stats', async () => {
    vi.mocked(api.meals.saveMeal).mockResolvedValue(new Meal(mealDto));
    vi.mocked(api.meals.getDailyStats).mockResolvedValue(new DailyStats(dailyStatsDto));
    const payload: SaveMealData = {
      mealText: 'Chicken and rice',
      category: 'lunch',
      time: '13:00',
      calories: 600,
      protein: 50,
      carbs: 60,
      fats: 15,
      feedback: null,
      extraData: null,
    };

    await logMeal(payload);

    expect(api.meals.saveMeal).toHaveBeenCalledWith(payload);
    expect(api.meals.getDailyStats).toHaveBeenCalledWith(todayDateString());
    const state = useMealsStore.getState();
    expect(state.meals).toHaveLength(1);
    expect(state.dailyStats?.consumed.calories).toBe(600);
    expect(state.isLoading).toBe(false);
  });

  it('logMeal records an error and rethrows on failure', async () => {
    vi.mocked(api.meals.saveMeal).mockRejectedValue(new Error('save failed'));

    await expect(
      logMeal({
        mealText: 'x',
        category: 'lunch',
        time: '13:00',
        calories: 1,
        protein: 1,
        carbs: 1,
        fats: 1,
        feedback: null,
        extraData: null,
      })
    ).rejects.toThrow('save failed');

    expect(useMealsStore.getState().error).toBe('save failed');
  });

  it('reset clears the store back to its initial state', () => {
    useMealsStore.setState({
      meals: [new Meal(mealDto)],
      dailyStats: new DailyStats(dailyStatsDto),
      isLoading: true,
      error: 'x',
    });

    useMealsStore.getState().reset();

    expect(useMealsStore.getState()).toMatchObject({
      meals: [],
      dailyStats: null,
      isLoading: false,
      error: null,
    });
  });
});

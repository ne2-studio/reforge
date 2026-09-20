// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn() };
});

import { get } from '../http';
import { weeklyProgressApi } from './weeklyProgress';

const weeklyProgressDto = {
  days: [{ date: '2026-01-01', targetCalories: 2200, consumedCalories: 2000, deficit: -200, mealsCount: 3 }],
  totalDeficit: -200,
  daysInDeficit: 1,
  daysInSurplus: 0,
  daysWithMeals: 1,
  adherenceStreak: 1,
  insights: ['Vas bien.'],
};

describe('weeklyProgressApi', () => {
  it('getWeeklyProgress hydrates a WeeklyProgress instance from GET /api/weekly-progress', async () => {
    vi.mocked(get).mockResolvedValue(weeklyProgressDto);

    const weeklyProgress = await weeklyProgressApi.getWeeklyProgress();

    expect(get).toHaveBeenCalledWith('/api/weekly-progress');
    expect(weeklyProgress.days).toHaveLength(1);
    expect(weeklyProgress.adherenceStreak).toBe(1);
    expect(weeklyProgress.insights).toEqual(['Vas bien.']);
  });
});

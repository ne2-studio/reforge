// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn() };
});

import { get, post } from '../http';
import { closedDaysApi } from './closedDays';

const closedDayDto = {
  date: '2026-01-01',
  closedAt: '2026-01-01T22:00:00.000Z',
  totalCalories: 2100,
  mealsCount: 4,
  isTrainingDay: true,
  analysis: 'Buen día.',
};

const weeklyProgressDto = {
  days: [
    { date: '2026-01-01', targetCalories: 2200, consumedCalories: 2000, deficit: -200, mealsCount: 3, isClosed: true },
  ],
  totalDeficit: -200,
  daysInDeficit: 1,
  daysInSurplus: 0,
  daysWithMeals: 1,
  adherenceStreak: 1,
  insights: ['Vas bien.'],
};

describe('closedDaysApi', () => {
  it('closeDay posts to /api/close-day with no body and hydrates the response', async () => {
    vi.mocked(post).mockResolvedValue(closedDayDto);

    const closedDay = await closedDaysApi.closeDay();

    expect(post).toHaveBeenCalledWith('/api/close-day', undefined);
    expect(closedDay.date).toBe('2026-01-01');
    expect(closedDay.totalCalories).toBe(2100);
    expect(closedDay.analysis).toBe('Buen día.');
  });

  it('getDayHistory hydrates ClosedDay instances from GET /api/day-history', async () => {
    vi.mocked(get).mockResolvedValue([closedDayDto]);

    const days = await closedDaysApi.getDayHistory();

    expect(get).toHaveBeenCalledWith('/api/day-history');
    expect(days).toHaveLength(1);
    expect(days[0].mealsCount).toBe(4);
  });

  it('getWeeklyProgress hydrates a WeeklyProgress instance from GET /api/weekly-progress', async () => {
    vi.mocked(get).mockResolvedValue(weeklyProgressDto);

    const weeklyProgress = await closedDaysApi.getWeeklyProgress();

    expect(get).toHaveBeenCalledWith('/api/weekly-progress');
    expect(weeklyProgress.days).toHaveLength(1);
    expect(weeklyProgress.adherenceStreak).toBe(1);
    expect(weeklyProgress.insights).toEqual(['Vas bien.']);
  });
});

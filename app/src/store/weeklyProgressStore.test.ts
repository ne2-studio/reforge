import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeeklyProgressStore } from './weeklyProgressStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    weeklyProgress: {
      getWeeklyProgress: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadWeeklyProgress } from '@/features/history/useCases';
import { WeeklyProgress } from '@/types';

const weeklyProgressDto = {
  days: [{ date: '2026-01-01', targetCalories: 2200, consumedCalories: 2000, deficit: -200, mealsCount: 3 }],
  totalDeficit: -200,
  daysInDeficit: 1,
  daysInSurplus: 0,
  daysWithMeals: 1,
  adherenceStreak: 1,
  insights: [],
};

describe('weeklyProgressStore + history useCases', () => {
  beforeEach(() => {
    useWeeklyProgressStore.setState({ weeklyProgress: null, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadWeeklyProgress populates the store on success', async () => {
    vi.mocked(api.weeklyProgress.getWeeklyProgress).mockResolvedValue(new WeeklyProgress(weeklyProgressDto));

    await loadWeeklyProgress();

    const state = useWeeklyProgressStore.getState();
    expect(state.weeklyProgress?.adherenceStreak).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('loadWeeklyProgress records an error message on failure', async () => {
    vi.mocked(api.weeklyProgress.getWeeklyProgress).mockRejectedValue(new Error('network down'));

    await loadWeeklyProgress();

    const state = useWeeklyProgressStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('reset clears the store back to its initial state', () => {
    useWeeklyProgressStore.setState({
      weeklyProgress: new WeeklyProgress(weeklyProgressDto),
      isLoading: true,
      error: 'x',
    });

    useWeeklyProgressStore.getState().reset();

    expect(useWeeklyProgressStore.getState()).toMatchObject({
      weeklyProgress: null,
      isLoading: false,
      error: null,
    });
  });
});

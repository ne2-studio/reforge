import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClosedDaysStore } from './closedDaysStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    closedDays: {
      closeDay: vi.fn(),
      getDayHistory: vi.fn(),
      getWeeklyProgress: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadDayHistory, loadWeeklyProgress, closeDay } from '@/features/dayClose/useCases';
import { ClosedDay, WeeklyProgress } from '@/types';

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
  insights: [],
};

describe('closedDaysStore + dayClose useCases', () => {
  beforeEach(() => {
    useClosedDaysStore.setState({ dayHistory: [], weeklyProgress: null, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadDayHistory populates the store on success', async () => {
    vi.mocked(api.closedDays.getDayHistory).mockResolvedValue([new ClosedDay(closedDayDto)]);

    await loadDayHistory();

    const state = useClosedDaysStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.dayHistory).toHaveLength(1);
    expect(state.dayHistory[0].totalCalories).toBe(2100);
  });

  it('loadDayHistory records an error message on failure', async () => {
    vi.mocked(api.closedDays.getDayHistory).mockRejectedValue(new Error('network down'));

    await loadDayHistory();

    const state = useClosedDaysStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('loadWeeklyProgress populates the store on success', async () => {
    vi.mocked(api.closedDays.getWeeklyProgress).mockResolvedValue(new WeeklyProgress(weeklyProgressDto));

    await loadWeeklyProgress();

    const state = useClosedDaysStore.getState();
    expect(state.weeklyProgress?.adherenceStreak).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('closeDay closes today, then reloads day history and weekly progress', async () => {
    vi.mocked(api.closedDays.closeDay).mockResolvedValue(new ClosedDay(closedDayDto));
    vi.mocked(api.closedDays.getDayHistory).mockResolvedValue([new ClosedDay(closedDayDto)]);
    vi.mocked(api.closedDays.getWeeklyProgress).mockResolvedValue(new WeeklyProgress(weeklyProgressDto));

    await closeDay();

    expect(api.closedDays.closeDay).toHaveBeenCalledTimes(1);
    expect(api.closedDays.getDayHistory).toHaveBeenCalledTimes(1);
    expect(api.closedDays.getWeeklyProgress).toHaveBeenCalledTimes(1);
    const state = useClosedDaysStore.getState();
    expect(state.dayHistory).toHaveLength(1);
    expect(state.weeklyProgress).not.toBeNull();
  });

  it('closeDay propagates its error without swallowing it into the store', async () => {
    vi.mocked(api.closedDays.closeDay).mockRejectedValue(new Error('Ya has cerrado el día de hoy'));

    await expect(closeDay()).rejects.toThrow('Ya has cerrado el día de hoy');
    expect(api.closedDays.getDayHistory).not.toHaveBeenCalled();
  });

  it('reset clears the store back to its initial state', () => {
    useClosedDaysStore.setState({
      dayHistory: [new ClosedDay(closedDayDto)],
      weeklyProgress: new WeeklyProgress(weeklyProgressDto),
      isLoading: true,
      error: 'x',
    });

    useClosedDaysStore.getState().reset();

    expect(useClosedDaysStore.getState()).toMatchObject({
      dayHistory: [],
      weeklyProgress: null,
      isLoading: false,
      error: null,
    });
  });
});

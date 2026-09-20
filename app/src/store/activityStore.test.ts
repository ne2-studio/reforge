import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useActivityStore } from './activityStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    activities: {
      getActivities: vi.fn(),
      logActivity: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadActivities, logActivity } from '@/features/activities/useCases';
import { Activity, type LogActivityData } from '@/types';

const strengthActivityDto = {
  id: 'activity-1',
  type: 'strength',
  duration: 45,
  steps: null,
  timestamp: '2026-01-01T13:00:00.000Z',
};

describe('activityStore + activities useCases', () => {
  beforeEach(() => {
    useActivityStore.setState({ activities: [], isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadActivities populates the store on success', async () => {
    vi.mocked(api.activities.getActivities).mockResolvedValue([new Activity(strengthActivityDto)]);

    await loadActivities();

    const state = useActivityStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.activities).toHaveLength(1);
    expect(state.activities[0].type).toBe('strength');
  });

  it('loadActivities records an error message on failure', async () => {
    vi.mocked(api.activities.getActivities).mockRejectedValue(new Error('network down'));

    await loadActivities();

    const state = useActivityStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('logActivity saves and prepends the activity to the store', async () => {
    vi.mocked(api.activities.logActivity).mockResolvedValue(new Activity(strengthActivityDto));
    const payload: LogActivityData = { type: 'strength', duration: 45, steps: null };

    await logActivity(payload);

    expect(api.activities.logActivity).toHaveBeenCalledWith(payload);
    const state = useActivityStore.getState();
    expect(state.activities).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });

  it('logActivity records an error and rethrows on failure', async () => {
    vi.mocked(api.activities.logActivity).mockRejectedValue(new Error('save failed'));

    await expect(logActivity({ type: 'strength', duration: 45, steps: null })).rejects.toThrow('save failed');

    expect(useActivityStore.getState().error).toBe('save failed');
  });

  it('reset clears the store back to its initial state', () => {
    useActivityStore.setState({
      activities: [new Activity(strengthActivityDto)],
      isLoading: true,
      error: 'x',
    });

    useActivityStore.getState().reset();

    expect(useActivityStore.getState()).toMatchObject({
      activities: [],
      isLoading: false,
      error: null,
    });
  });
});

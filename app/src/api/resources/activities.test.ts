// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn() };
});

import { get, post } from '../http';
import { activitiesApi } from './activities';

const strengthDto = {
  id: 'activity-1',
  type: 'strength',
  duration: 45,
  steps: null,
  timestamp: '2026-01-01T13:00:00.000Z',
};

describe('activitiesApi', () => {
  it('getActivities hydrates Activity instances from GET /api/activities', async () => {
    vi.mocked(get).mockResolvedValue([strengthDto]);

    const activities = await activitiesApi.getActivities();

    expect(get).toHaveBeenCalledWith('/api/activities');
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('strength');
    expect(activities[0].duration).toBe(45);
  });

  it('logActivity posts to /api/activities and hydrates the response', async () => {
    vi.mocked(post).mockResolvedValue(strengthDto);

    const activity = await activitiesApi.logActivity({ type: 'strength', duration: 45, steps: null });

    expect(post).toHaveBeenCalledWith('/api/activities', { type: 'strength', duration: 45, steps: null });
    expect(activity.id).toBe('activity-1');
  });
});

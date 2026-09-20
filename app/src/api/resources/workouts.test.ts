// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn() };
});

import { get, post } from '../http';
import { workoutsApi } from './workouts';

const strengthDto = {
  id: 'workout-1',
  type: 'strength',
  volume: 2500,
  duration: null,
  timestamp: '2026-01-01T13:00:00.000Z',
};

describe('workoutsApi', () => {
  it('getWorkouts hydrates Workout instances from GET /api/workouts', async () => {
    vi.mocked(get).mockResolvedValue([strengthDto]);

    const workouts = await workoutsApi.getWorkouts();

    expect(get).toHaveBeenCalledWith('/api/workouts');
    expect(workouts).toHaveLength(1);
    expect(workouts[0].type).toBe('strength');
    expect(workouts[0].volume).toBe(2500);
  });

  it('logWorkout posts to /api/workouts and hydrates the response', async () => {
    vi.mocked(post).mockResolvedValue(strengthDto);

    const workout = await workoutsApi.logWorkout({ type: 'strength', volume: 2500, duration: null });

    expect(post).toHaveBeenCalledWith('/api/workouts', { type: 'strength', volume: 2500, duration: null });
    expect(workout.id).toBe('workout-1');
  });
});

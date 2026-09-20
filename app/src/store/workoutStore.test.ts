import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkoutStore } from './workoutStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    workouts: {
      getWorkouts: vi.fn(),
      logWorkout: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadWorkouts, logWorkout } from '@/features/workouts/useCases';
import { Workout, type LogWorkoutData } from '@/types';

const strengthWorkoutDto = {
  id: 'workout-1',
  type: 'strength',
  volume: 2500,
  duration: null,
  timestamp: '2026-01-01T13:00:00.000Z',
};

describe('workoutStore + workouts useCases', () => {
  beforeEach(() => {
    useWorkoutStore.setState({ workouts: [], isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadWorkouts populates the store on success', async () => {
    vi.mocked(api.workouts.getWorkouts).mockResolvedValue([new Workout(strengthWorkoutDto)]);

    await loadWorkouts();

    const state = useWorkoutStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.workouts).toHaveLength(1);
    expect(state.workouts[0].type).toBe('strength');
  });

  it('loadWorkouts records an error message on failure', async () => {
    vi.mocked(api.workouts.getWorkouts).mockRejectedValue(new Error('network down'));

    await loadWorkouts();

    const state = useWorkoutStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('logWorkout saves and prepends the workout to the store', async () => {
    vi.mocked(api.workouts.logWorkout).mockResolvedValue(new Workout(strengthWorkoutDto));
    const payload: LogWorkoutData = { type: 'strength', volume: 2500, duration: null };

    await logWorkout(payload);

    expect(api.workouts.logWorkout).toHaveBeenCalledWith(payload);
    const state = useWorkoutStore.getState();
    expect(state.workouts).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });

  it('logWorkout records an error and rethrows on failure', async () => {
    vi.mocked(api.workouts.logWorkout).mockRejectedValue(new Error('save failed'));

    await expect(logWorkout({ type: 'strength', volume: 2500, duration: null })).rejects.toThrow('save failed');

    expect(useWorkoutStore.getState().error).toBe('save failed');
  });

  it('reset clears the store back to its initial state', () => {
    useWorkoutStore.setState({
      workouts: [new Workout(strengthWorkoutDto)],
      isLoading: true,
      error: 'x',
    });

    useWorkoutStore.getState().reset();

    expect(useWorkoutStore.getState()).toMatchObject({
      workouts: [],
      isLoading: false,
      error: null,
    });
  });
});

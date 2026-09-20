import { get, post } from '../http';
import { Workout, type WorkoutDtoShape, type LogWorkoutData } from '../../types';

export const workoutsApi = {
  // GET /api/workouts — the caller's own workouts, most recent first.
  async getWorkouts(): Promise<Workout[]> {
    const data = await get<WorkoutDtoShape[]>('/api/workouts');
    return data.map((workout) => new Workout(workout));
  },

  // POST /api/workouts — logs a new workout. Returns the saved workout, timestamp server-set.
  async logWorkout(data: LogWorkoutData): Promise<Workout> {
    const saved = await post<WorkoutDtoShape>('/api/workouts', data);
    return new Workout(saved);
  },
};

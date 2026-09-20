import type { Activity } from '@/types';

// Client-side calorie estimate for the activity history display only — never sent to, or
// received from, the backend (Activity has no calories field). Local to this feature, not a
// shared utility, since Workout has no equivalent need. Rates match the source
// reforge-frontend's ActivityTracker.tsx: ~6 kcal/min strength, ~8 kcal/min cardio,
// ~0.04 kcal/step NEAT.
export function estimateCalories(activity: Pick<Activity, 'type' | 'duration' | 'steps'>): number {
  if (activity.type === 'strength') return Math.round((activity.duration ?? 0) * 6);
  if (activity.type === 'cardio') return Math.round((activity.duration ?? 0) * 8);
  return Math.round((activity.steps ?? 0) * 0.04);
}

import { create } from 'zustand';
import { activityService } from '../services/activity.service';
import { useAuthStore } from './useAuthStore';
import { Workout, Activity } from '../types';

interface ActivityState {
  activities: Activity[];
  workouts: Workout[];
  isLoadingActivities: boolean;
  isLoadingWorkouts: boolean;
  
  // Actions
  fetchActivities: () => Promise<void>;
  fetchWorkouts: () => Promise<void>;
  logActivity: (activity: Omit<Activity, "id">) => Promise<void>;
  logWorkout: (workout: Omit<Workout, "id">) => Promise<void>;
  clearActivityData: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  workouts: [],
  isLoadingActivities: false,
  isLoadingWorkouts: false,

  fetchActivities: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingActivities: true });
    try {
      const data = await activityService.getActivities(token);
      set({ activities: data.activities || [] });
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      set({ isLoadingActivities: false });
    }
  },

  fetchWorkouts: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingWorkouts: true });
    try {
      const data = await activityService.getWorkouts(token);
      set({ workouts: data.workouts || [] });
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      set({ isLoadingWorkouts: false });
    }
  },

  logActivity: async (activity) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      await activityService.logActivity(token, activity);
      await get().fetchActivities();
    } catch (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
  },

  logWorkout: async (workout) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      await activityService.logWorkout(token, workout);
      await get().fetchWorkouts();
    } catch (error) {
      console.error("Error logging workout:", error);
      throw error;
    }
  },

  clearActivityData: () => {
    set({ activities: [], workouts: [], isLoadingActivities: false, isLoadingWorkouts: false });
  }
}));

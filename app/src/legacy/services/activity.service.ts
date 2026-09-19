import { Workout, Activity } from "../types";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export const activityService = {
  async getWorkouts(accessToken: string): Promise<{ workouts: Workout[] }> {
    const response = await fetch(`${BASE_URL}/workouts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load workouts: ${response.status}`);
    }

    return response.json();
  },

  async logWorkout(accessToken: string, workout: Omit<Workout, "id">): Promise<{ workout: Workout }> {
    const response = await fetch(`${BASE_URL}/workouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(workout),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to log workout: ${response.status}`);
    }

    return response.json();
  },

  async getActivities(accessToken: string): Promise<{ activities: Activity[] }> {
    const response = await fetch(`${BASE_URL}/activities`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load activities: ${response.status}`);
    }

    return response.json();
  },

  async logActivity(accessToken: string, activity: Omit<Activity, "id">): Promise<{ activity: Activity }> {
    const response = await fetch(`${BASE_URL}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to log activity: ${response.status}`);
    }

    return response.json();
  },
};

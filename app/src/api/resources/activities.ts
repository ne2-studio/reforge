import { get, post } from '../http';
import { Activity, type ActivityDtoShape, type LogActivityData } from '../../types';

export const activitiesApi = {
  // GET /api/activities — the caller's own activities, most recent first.
  async getActivities(): Promise<Activity[]> {
    const data = await get<ActivityDtoShape[]>('/api/activities');
    return data.map((activity) => new Activity(activity));
  },

  // POST /api/activities — logs a new activity. Returns the saved activity, timestamp
  // server-set.
  async logActivity(data: LogActivityData): Promise<Activity> {
    const saved = await post<ActivityDtoShape>('/api/activities', data);
    return new Activity(saved);
  },
};

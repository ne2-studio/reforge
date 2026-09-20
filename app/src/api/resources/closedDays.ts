import { get, post } from '../http';
import { ClosedDay, WeeklyProgress, type ClosedDayDtoShape, type WeeklyProgressDtoShape } from '../../types';

export const closedDaysApi = {
  // POST /api/close-day — closes today (server-resolved, no body/date param). Fails 400 if the
  // caller has no meals logged today, or if today is already closed.
  async closeDay(): Promise<ClosedDay> {
    const data = await post<ClosedDayDtoShape>('/api/close-day', undefined);
    return new ClosedDay(data);
  },

  // GET /api/day-history — all the caller's closed days, most recent first.
  async getDayHistory(): Promise<ClosedDay[]> {
    const data = await get<ClosedDayDtoShape[]>('/api/day-history');
    return data.map((day) => new ClosedDay(day));
  },

  // GET /api/weekly-progress — last 7 days (today inclusive).
  async getWeeklyProgress(): Promise<WeeklyProgress> {
    const data = await get<WeeklyProgressDtoShape>('/api/weekly-progress');
    return new WeeklyProgress(data);
  },
};

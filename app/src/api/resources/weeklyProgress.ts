import { get } from '../http';
import { WeeklyProgress, type WeeklyProgressDtoShape } from '../../types';

export const weeklyProgressApi = {
  // GET /api/weekly-progress — last 7 days (today inclusive).
  async getWeeklyProgress(): Promise<WeeklyProgress> {
    const data = await get<WeeklyProgressDtoShape>('/api/weekly-progress');
    return new WeeklyProgress(data);
  },
};

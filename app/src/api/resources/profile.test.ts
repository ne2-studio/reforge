// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn() };
});

import { get, post, ApiError } from '../http';
import { profileApi } from './profile';

const dto = {
  age: 25,
  gender: 'female',
  height: 165,
  weight: 60,
  activityLevel: 'moderate',
  goal: 'maintain',
  trainingDays: ['friday'],
  trainingType: 'cardio',
  trainingTime: 'morning',
  restrictions: null,
  calorieTarget: 2000,
  extraData: {},
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('profileApi', () => {
  it('getProfile hydrates a UserProfile from GET /api/profile', async () => {
    vi.mocked(get).mockResolvedValue(dto);

    const profile = await profileApi.getProfile();

    expect(get).toHaveBeenCalledWith('/api/profile');
    expect(profile?.age).toBe(25);
    expect(profile?.updatedAt).toBeInstanceOf(Date);
  });

  it('getProfile returns null when the backend reports 404 (no profile saved yet)', async () => {
    vi.mocked(get).mockRejectedValue(new ApiError(404, 'not found', { error: 'not found' }));

    const profile = await profileApi.getProfile();

    expect(profile).toBeNull();
  });

  it('getProfile rethrows non-404 errors', async () => {
    vi.mocked(get).mockRejectedValue(new ApiError(500, 'boom', { error: 'boom' }));

    await expect(profileApi.getProfile()).rejects.toThrow('boom');
  });

  it('saveProfile posts to /api/profile and hydrates the response', async () => {
    vi.mocked(post).mockResolvedValue(dto);

    const profile = await profileApi.saveProfile({
      age: 25,
      gender: 'female',
      height: 165,
      weight: 60,
      activityLevel: 'moderate',
      goal: 'maintain',
      trainingDays: ['friday'],
      trainingType: 'cardio',
      trainingTime: 'morning',
      restrictions: null,
      calorieTarget: 2000,
      extraData: null,
    });

    expect(post).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ age: 25 }));
    expect(profile.goal).toBe('maintain');
  });
});

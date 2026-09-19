import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileStore } from './profileStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    profile: {
      getProfile: vi.fn(),
      saveProfile: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadProfile, submitProfile } from '@/features/profile/useCases';
import { UserProfile, type SaveProfileData } from '@/types';

const profileDto = {
  age: 30,
  gender: 'male',
  height: 180,
  weight: 80,
  activityLevel: null,
  goal: 'maintain',
  trainingDays: ['monday'],
  trainingType: null,
  trainingTime: null,
  restrictions: null,
  calorieTarget: null,
  extraData: {},
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('profileStore + profile useCases', () => {
  beforeEach(() => {
    useProfileStore.setState({ profile: null, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadProfile populates the store on success', async () => {
    vi.mocked(api.profile.getProfile).mockResolvedValue(new UserProfile(profileDto));

    await loadProfile();

    const state = useProfileStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.profile?.age).toBe(30);
  });

  it('loadProfile treats a missing profile (null) as a normal onboarding state, not an error', async () => {
    vi.mocked(api.profile.getProfile).mockResolvedValue(null);

    await loadProfile();

    const state = useProfileStore.getState();
    expect(state.profile).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('loadProfile records an error message on failure', async () => {
    vi.mocked(api.profile.getProfile).mockRejectedValue(new Error('network down'));

    await loadProfile();

    const state = useProfileStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('submitProfile saves and writes the returned profile into the store', async () => {
    vi.mocked(api.profile.saveProfile).mockResolvedValue(new UserProfile(profileDto));
    const payload: SaveProfileData = {
      age: 30,
      gender: 'male',
      height: 180,
      weight: 80,
      activityLevel: null,
      goal: 'maintain',
      trainingDays: ['monday'],
      trainingType: null,
      trainingTime: null,
      restrictions: null,
      calorieTarget: null,
      extraData: null,
    };

    await submitProfile(payload);

    expect(api.profile.saveProfile).toHaveBeenCalledWith(payload);
    expect(useProfileStore.getState().profile?.goal).toBe('maintain');
  });

  it('submitProfile records an error and rethrows on failure', async () => {
    vi.mocked(api.profile.saveProfile).mockRejectedValue(new Error('save failed'));

    await expect(
      submitProfile({
        age: null,
        gender: null,
        height: null,
        weight: null,
        activityLevel: null,
        goal: null,
        trainingDays: null,
        trainingType: null,
        trainingTime: null,
        restrictions: null,
        calorieTarget: null,
        extraData: null,
      })
    ).rejects.toThrow('save failed');

    expect(useProfileStore.getState().error).toBe('save failed');
  });

  it('reset clears the store back to its initial state', () => {
    useProfileStore.setState({ profile: new UserProfile(profileDto), isLoading: true, error: 'x' });

    useProfileStore.getState().reset();

    expect(useProfileStore.getState()).toMatchObject({ profile: null, isLoading: false, error: null });
  });
});

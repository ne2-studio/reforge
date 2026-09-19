import { get, post, isApiErrorWithStatus } from '../http';
import { UserProfile, type ProfileDtoShape, type SaveProfileData } from '../../types';

export const profileApi = {
  // GET /api/profile — 404 (`{ "error": "..." }`) means the caller hasn't saved a profile
  // yet, a normal onboarding state rather than an error; callers should treat that as
  // "no profile" (see ProfileRoute), not surface it as a failure.
  async getProfile(): Promise<UserProfile | null> {
    try {
      const data = await get<ProfileDtoShape>('/api/profile');
      return new UserProfile(data);
    } catch (error) {
      if (isApiErrorWithStatus(error, 404)) return null;
      throw error;
    }
  },

  // POST /api/profile — full replace, not a partial patch. Returns the saved profile.
  async saveProfile(data: SaveProfileData): Promise<UserProfile> {
    const saved = await post<ProfileDtoShape>('/api/profile', data);
    return new UserProfile(saved);
  },
};

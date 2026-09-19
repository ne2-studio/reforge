import { create } from 'zustand';
import { UserProfile } from '../types';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for the user's profile — see docs/architecture/frontend.md's `store/` layer.
// `profile: null` doubles as "not loaded yet" and "no profile saved" (a 404 from GET, a
// normal onboarding state); useCases/index.ts's loadProfile() is the only place that tells
// those two apart, via isLoading.
//
// There's no cross-store "reset everything on sign-out" plumbing yet (this is the only
// domain store in the app so far) — this is just this store's own reset() for when that
// mechanism gets built in a later slice.
export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  reset: () => set({ profile: null, isLoading: false, error: null }),
}));

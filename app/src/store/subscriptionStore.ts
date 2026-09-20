import { create } from 'zustand';
import { Subscription } from '../types';

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for the caller's own Suscripción (tier/status/usage) — see
// docs/architecture/frontend.md's `store/` layer. `subscription: null` doubles as "not loaded
// yet" and "loading failed", same reasoning as profileStore's `profile: null`; SubscriptionRoute
// is the one reader today, but the Profile screen's UsageLimits indicator reads it too, so it's
// a genuine shared/must-survive-navigation store, not a route-local fetch.
//
// There's no cross-store "reset everything on sign-out" plumbing in this codebase yet (see
// profileStore's own comment on this — no store's reset() is called from PingRoute's own
// sign-out handler either) — this is just this store's own reset(), for when that mechanism
// gets built.
export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  isLoading: false,
  error: null,
  reset: () => set({ subscription: null, isLoading: false, error: null }),
}));

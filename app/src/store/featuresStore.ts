import { create } from 'zustand';

interface FeaturesState {
  subscriptions: boolean;
  isLoaded: boolean;
  reset: () => void;
}

// Domain store for global feature toggles — see docs/architecture/frontend.md's `store/`
// layer. Slice 9's subscription feature is entirely gated on `subscriptions`: the app must
// never render subscription nav/routes/usage bars/paywall dialogs, nor call any
// `/api/subscription*` route, while this is false. Defaults to `false`/`isLoaded: false` so a
// not-yet-loaded state fails closed exactly like a genuinely-disabled one, rather than
// flashing subscription UI before the real value arrives.
//
// Loaded once on auth from app/App.tsx (see that file's comment) — there's no per-route owner
// the way profileStore/mealsStore have one, since gating a route/nav entry has to happen
// before any single feature route would otherwise mount.
export const useFeaturesStore = create<FeaturesState>((set) => ({
  subscriptions: false,
  isLoaded: false,
  reset: () => set({ subscriptions: false, isLoaded: false }),
}));

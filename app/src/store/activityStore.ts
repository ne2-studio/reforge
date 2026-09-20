import { create } from 'zustand';
import { Activity } from '../types';

interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for activities — see docs/architecture/frontend.md's `store/` layer. A single
// consumer today (ActivityRoute), kept as its own store rather than folded into another
// domain's since activities are an independent backend feature with its own DTOs (Slice 4).
export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  isLoading: false,
  error: null,
  reset: () => set({ activities: [], isLoading: false, error: null }),
}));

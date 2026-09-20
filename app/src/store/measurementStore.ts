import { create } from 'zustand';
import { Measurement } from '../types';

interface MeasurementState {
  measurements: Measurement[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for measurements — see docs/architecture/frontend.md's `store/` layer. A single
// consumer today (ProgressRoute), kept as its own store rather than folded into another domain
// store since measurements are an independent backend feature with their own DTOs (Slice 5).
export const useMeasurementStore = create<MeasurementState>((set) => ({
  measurements: [],
  isLoading: false,
  error: null,
  reset: () => set({ measurements: [], isLoading: false, error: null }),
}));

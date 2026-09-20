import { create } from 'zustand';
import { ChatMessage } from '../types';

interface CoachState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Domain store for the AI coach chat — see docs/architecture/frontend.md's `store/` layer.
// Same shape/simplicity as closedDaysStore: ChatRoute reads it, CoachChat renders it, and it
// must survive whatever navigation happens while a reply is in flight (e.g. FloatingCoachButton
// opening/closing /chat shouldn't lose history already loaded this session).
export const useCoachStore = create<CoachState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  reset: () => set({ messages: [], isLoading: false, error: null }),
}));

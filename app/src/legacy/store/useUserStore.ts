import { create } from 'zustand';
import { profileService } from '../services/profile.service';
import { progressService } from '../services/progress.service';
import { subscriptionService } from '../services/subscription.service';
import { useAuthStore } from './useAuthStore';
import { UserProfile, Measurement, SubscriptionStatus } from '../types';

interface UserState {
  profile: UserProfile | null;
  measurements: Measurement[];
  subscription: SubscriptionStatus | null;
  isLoadingProfile: boolean;
  isLoadingMeasurements: boolean;
  isLoadingSubscription: boolean;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (profileData: UserProfile) => Promise<void>;
  fetchMeasurements: () => Promise<void>;
  addMeasurement: (measurement: Omit<Measurement, "id">) => Promise<void>;
  fetchSubscription: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  measurements: [],
  subscription: null,
  isLoadingProfile: false,
  isLoadingMeasurements: false,
  isLoadingSubscription: false,

  fetchProfile: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    
    set({ isLoadingProfile: true });
    try {
      const data = await profileService.getProfile(token);
      set({ profile: data.profile });
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      // If profile doesn't exist (404), we keep profile as null which triggers onboarding
      if (error.message?.includes('404') || error.message?.toLowerCase().includes('not found')) {
        set({ profile: null });
      }
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  updateProfile: async (profileData: UserProfile) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      const data = await profileService.updateProfile(token, profileData);
      set({ profile: data.profile });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  fetchMeasurements: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingMeasurements: true });
    try {
      const data = await progressService.getMeasurements(token);
      set({ measurements: data.measurements || [] });
    } catch (error) {
      console.error("Error fetching measurements:", error);
    } finally {
      set({ isLoadingMeasurements: false });
    }
  },

  addMeasurement: async (measurement: Omit<Measurement, "id">) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      await progressService.saveMeasurement(token, measurement);
      await get().fetchMeasurements();
    } catch (error) {
      console.error("Error adding measurement:", error);
      throw error;
    }
  },

  fetchSubscription: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingSubscription: true });
    try {
      const data = await subscriptionService.getSubscriptionStatus(token);
      set({ subscription: data.subscription });
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      set({ isLoadingSubscription: false });
    }
  },

  clearUser: () => {
    set({ profile: null, measurements: [], subscription: null });
  }
}));

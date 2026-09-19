import { create } from 'zustand';
import { mealService } from '../services/meal.service';
import { useAuthStore } from './useAuthStore';
import { Meal, LibraryMeal, DailyMenu, MealAnalysis, DailyStats } from '../types';

interface MealState {
  meals: Meal[];
  libraryMeals: LibraryMeal[];
  dailyMenu: DailyMenu | null;
  dailyStats: DailyStats | null;
  dayHistory: any[];
  weeklyProgress: any | null;
  isLoadingMeals: boolean;
  isLoadingLibrary: boolean;
  isLoadingMenu: boolean;
  isLoadingStats: boolean;
  isLoadingHistory: boolean;
  isLoadingWeekly: boolean;

  // Actions
  fetchMeals: () => Promise<void>;
  fetchLibrary: () => Promise<void>;
  fetchDailyMenu: (date?: string) => Promise<void>;
  fetchDailyStats: (date?: string) => Promise<void>;
  generateDailyMenu: (force?: boolean, isTrainingDay?: boolean) => Promise<void>;
  fetchDayHistory: () => Promise<void>;
  fetchWeeklyProgress: () => Promise<void>;
  addMeal: (data: { 
    mealText: string; 
    category: string; 
    time: string; 
    manualAnalysis?: MealAnalysis 
  }) => Promise<void>;
  addToLibrary: (mealData: Omit<LibraryMeal, "id">) => Promise<void>;
  removeFromLibrary: (mealId: string) => Promise<void>;
  clearMeals: () => void;
}

export const useMealStore = create<MealState>((set, get) => ({
  meals: [],
  libraryMeals: [],
  dailyMenu: null,
  dailyStats: null,
  dayHistory: [],
  weeklyProgress: null,
  isLoadingMeals: false,
  isLoadingLibrary: false,
  isLoadingMenu: false,
  isLoadingStats: false,
  isLoadingHistory: false,
  isLoadingWeekly: false,

  fetchMeals: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingMeals: true });
    try {
      const data = await mealService.getMeals(token);
      set({ meals: data.meals || [] });
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      set({ isLoadingMeals: false });
    }
  },

  fetchLibrary: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingLibrary: true });
    try {
      const data = await mealService.getMealLibrary(token);
      set({ libraryMeals: data.meals || [] });
    } catch (error) {
      console.error("Error fetching library:", error);
    } finally {
      set({ isLoadingLibrary: false });
    }
  },

  fetchDailyMenu: async (date?: string) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const targetDate = date || new Date().toISOString().split('T')[0];
    set({ isLoadingMenu: true });
    try {
      const data = await mealService.getDailyMenu(token, targetDate);
      set({ dailyMenu: data.menu });
    } catch (error) {
      console.error("Error fetching daily menu:", error);
    } finally {
      set({ isLoadingMenu: false });
    }
  },

  fetchDailyStats: async (date?: string) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const targetDate = date || new Date().toISOString().split('T')[0];
    set({ isLoadingStats: true });
    try {
      const data = await mealService.getDailyStats(token, targetDate);
      set({ dailyStats: data });
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    } finally {
      set({ isLoadingStats: false });
    }
  },

  generateDailyMenu: async (force?: boolean, isTrainingDay?: boolean) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingMenu: true });
    try {
      const data = await mealService.generateDailyMenu(token, force, isTrainingDay);
      set({ dailyMenu: data.menu });
    } catch (error) {
      console.error("Error generating daily menu:", error);
      throw error;
    } finally {
      set({ isLoadingMenu: false });
    }
  },

  fetchDayHistory: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingHistory: true });
    try {
      const data = await mealService.getDayHistory(token);
      set({ dayHistory: data.days || [] });
    } catch (error) {
      console.error("Error fetching day history:", error);
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  fetchWeeklyProgress: async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    set({ isLoadingWeekly: true });
    try {
      const data = await mealService.getWeeklyProgress(token);
      set({ weeklyProgress: data });
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
    } finally {
      set({ isLoadingWeekly: false });
    }
  },

  addMeal: async (mealData) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      await mealService.analyzeMeal(token, mealData);
      await Promise.all([
        get().fetchMeals(),
        get().fetchDailyStats(),
        get().fetchWeeklyProgress(),
        get().fetchDayHistory(),
      ]);
    } catch (error) {
      console.error("Error adding meal:", error);
      throw error;
    }
  },

  addToLibrary: async (mealData) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      await mealService.addToLibrary(token, mealData);
      await get().fetchLibrary();
    } catch (error) {
      console.error("Error adding to library:", error);
      throw error;
    }
  },

  removeFromLibrary: async (mealId: string) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    try {
      await mealService.removeFromLibrary(token, mealId);
      await get().fetchLibrary();
    } catch (error) {
      console.error("Error removing from library:", error);
      throw error;
    }
  },

  clearMeals: () => {
    set({ 
      meals: [], 
      libraryMeals: [], 
      dailyMenu: null, 
      dailyStats: null,
      dayHistory: [], 
      weeklyProgress: null 
    });
  }
}));

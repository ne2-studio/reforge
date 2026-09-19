import { Meal, LibraryMeal, MealAnalysis, DailyMenu, DailyStats } from "../types";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export const mealService = {
  async getDailyStats(accessToken: string, date: string): Promise<DailyStats> {
    const response = await fetch(`${BASE_URL}/daily-stats/${date}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load daily stats: ${response.status}`);
    }

    return response.json();
  },

  async getMeals(accessToken: string): Promise<{ meals: Meal[] }> {
    const response = await fetch(`${BASE_URL}/meals`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load meals: ${response.status}`);
    }

    return response.json();
  },

  async analyzeMeal(
    accessToken: string, 
    data: { 
      mealText: string; 
      category: string; 
      time: string; 
      manualAnalysis?: MealAnalysis 
    }
  ): Promise<{ analysis: MealAnalysis }> {
    const response = await fetch(`${BASE_URL}/analyze-meal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to analyze meal: ${response.status}`);
    }

    return response.json();
  },

  async getDailyMenu(accessToken: string, date: string): Promise<{ menu: DailyMenu }> {
    const response = await fetch(`${BASE_URL}/daily-menu/${date}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load daily menu: ${response.status}`);
    }

    return response.json();
  },

  async getMealLibrary(accessToken: string): Promise<{ meals: LibraryMeal[] }> {
    const response = await fetch(`${BASE_URL}/meal-library`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load meal library: ${response.status}`);
    }

    return response.json();
  },

  async addToLibrary(accessToken: string, mealData: Omit<LibraryMeal, "id">): Promise<{ meal: LibraryMeal }> {
    const response = await fetch(`${BASE_URL}/meal-library`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(mealData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to add meal to library: ${response.status}`);
    }

    return response.json();
  },

  async removeFromLibrary(accessToken: string, mealId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/meal-library/${mealId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to remove meal from library: ${response.status}`);
    }
  },

  async getDayHistory(accessToken: string): Promise<{ days: any[] }> {
    const response = await fetch(`${BASE_URL}/day-history`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load day history: ${response.status}`);
    }

    return response.json();
  },

  async getWeeklyProgress(accessToken: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/weekly-progress`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load weekly progress: ${response.status}`);
    }

    return response.json();
  },

  async generateDailyMenu(accessToken: string, force?: boolean, isTrainingDay?: boolean): Promise<{ menu: any }> {
    const response = await fetch(`${BASE_URL}/generate-daily-menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ force, isTrainingDay }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to generate daily menu: ${response.status}`);
    }

    return response.json();
  }
};

export interface Workout {
  id?: string;
  type: "strength" | "cardio";
  volume?: number;
  duration?: number;
  timestamp: string;
}

export interface Activity {
  id?: string;
  type: "strength" | "cardio" | "neat";
  duration?: number;
  steps?: number;
  timestamp: string;
}

export interface UserProfile {
  age: string;
  gender: string;
  weight: string;
  height: string;
  waist: string;
  neck: string;
  goal: string;
  goalBodyFat: string;
  caloricPreference: string;
  calorieTarget?: number;
  restrictions: string;
  trainingDays?: string[];
}

export interface Meal {
  id?: string;
  timestamp: string;
  mealText: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: string;
  feedback?: string;
  time?: string;
  analysis?: MealAnalysis;
}

export interface LibraryMeal {
  id: string;
  title: string;
  description: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  feedback: string;
}

export interface DailyMenu {
  date: string;
  totalCalories: string;
  protein: string;
  carbs: string;
  fats: string;
  isTrainingDay?: boolean;
  manualOverride?: boolean;
  meals: {
    type: string;
    suggestion: string;
    target: string;
  }[];
  suggestions?: MealSuggestion[];
  macros?: string;
}

export interface MealSuggestion {
  meal: string;
  emoji: string;
  options: string[];
  tips: string;
}

export interface Measurement {
  id?: string;
  weight?: number;
  waist?: number;
  neck?: number;
  timestamp: string;
}

export interface SubscriptionStatus {
  tier: "free" | "premium";
  mealAnalysisUsed?: number;
  mealAnalysisLimit?: number;
  chatMessagesUsed?: number;
  chatMessagesLimit?: number;
}

export interface Message {
  userMessage: string;
  assistantMessage: string;
  timestamp: string;
}

export interface DailyStats {
  date: string;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

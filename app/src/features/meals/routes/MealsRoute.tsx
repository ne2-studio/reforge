import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMealsStore } from '@/store/mealsStore';
import { loadMeals, loadDailyStats, logMeal, todayDateString } from '../useCases';
import { DailyStats } from '../components/DailyStats';
import { MealLogger } from '../components/MealLogger';
import type { SaveMealData } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  'mid-morning': 'Media mañana',
  lunch: 'Comida',
  snack: 'Merienda',
  dinner: 'Cena',
};

// Container for /comidas. Loads the caller's meals plus today's daily-stats through the
// meals store on mount (shared between DailyStats and this route's own today's-meals list —
// see docs/architecture/frontend.md's Route-may-call-api-directly exception, which does NOT
// apply here). No MealHistory/DayHistory here — those need day-history/closed days, deferred
// to Slice 7 (docs/plan/02-vertical-slices.md).
export function MealsRoute() {
  const { meals, dailyStats, isLoading, error } = useMealsStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadMeals();
    void loadDailyStats(todayDateString());
  }, []);

  const handleSave = async (data: SaveMealData) => {
    setIsSaving(true);
    try {
      await logMeal(data);
      toast.success('¡Comida guardada! ✅');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar la comida');
    } finally {
      setIsSaving(false);
    }
  };

  const today = todayDateString();
  const todaysMeals = meals.filter((meal) => meal.date === today);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <button
          className="underline"
          onClick={() => {
            void loadMeals();
            void loadDailyStats(today);
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Comidas</h1>
        <DailyStats dailyStats={dailyStats} isLoading={isLoading} />
        <MealLogger isSaving={isSaving} onSave={handleSave} />
        <div className="bg-card rounded-2xl p-6 border-2 border-border">
          <h3 className="text-lg mb-4">Comidas de hoy</h3>
          {todaysMeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has registrado comidas hoy.</p>
          ) : (
            <ul className="space-y-3">
              {todaysMeals.map((meal) => (
                <li key={meal.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{CATEGORY_LABELS[meal.category] ?? meal.category}</span>
                    <span className="text-xs text-muted-foreground">{meal.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{meal.mealText}</p>
                  <div className="flex gap-3 text-xs flex-wrap mt-1">
                    <span>{meal.calories} kcal</span>
                    <span>{meal.protein}g proteína</span>
                    <span>{meal.carbs}g carbos</span>
                    <span>{meal.fats}g grasas</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

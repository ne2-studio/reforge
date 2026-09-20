import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isApiErrorWithStatus } from '@/api';
import { useMealsStore } from '@/store/mealsStore';
import { useMealLibraryStore } from '@/store/mealLibraryStore';
import { useFeaturesStore } from '@/store/featuresStore';
import { loadMeals, logMeal, analyzeAndLogMeal, todayDateString } from '../useCases';
import { loadLibrary, saveToLibrary } from '@/features/mealLibrary/useCases';
import { MealLogger } from '../components/MealLogger';
import { FloatingCoachButton } from '@/features/coach/components/FloatingCoachButton';
import { AILimitReached } from '@/features/subscription/components/AILimitReached';
import type { AnalyzeMealData, SaveMealData, SaveMealLibraryItemData } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  'mid-morning': 'Media mañana',
  lunch: 'Comida',
  snack: 'Merienda',
  dinner: 'Cena',
};

// Container for /comidas. Loads the caller's meals through the meals store on mount. The
// "Resumen de hoy" daily-stats card used to live here too — it now renders on /home
// (features/home), which loads dailyStats itself; logMeal/analyzeAndLogMeal below still
// refresh the shared mealsStore.dailyStats after a save so that card stays current. Only shows
// today's meals — full meal history, day-close, day history, and weekly progress live at
// /historial (features/dayClose, Slice 7).
export function MealsRoute() {
  const navigate = useNavigate();
  const { meals, error } = useMealsStore();
  const { items: libraryItems } = useMealLibraryStore();
  const { subscriptions: subscriptionsEnabled } = useFeaturesStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLimitReachedOpen, setIsLimitReachedOpen] = useState(false);

  useEffect(() => {
    void loadMeals();
    // Loaded here (not just on /biblioteca-comidas) so MealLogger's "cargar de biblioteca"
    // picker has data without a second, feature-crossing fetch — mealLibraryStore is the
    // single shared source for both routes (docs/architecture/frontend.md's store layer).
    void loadLibrary();
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

  // Slice 9: a 403 on the analyze-meal endpoint means the caller's monthly AI usage limit was
  // hit — but only when featuresStore.subscriptions is true, since that's the only backend
  // configuration where this endpoint enforces any such limit at all; with the toggle off, a
  // 403 here would mean something else entirely and must fall through to the generic error
  // toast unchanged.
  const handleAnalyze = async (data: AnalyzeMealData) => {
    setIsAnalyzing(true);
    try {
      await analyzeAndLogMeal(data);
      toast.success('¡Comida analizada y guardada! ✅');
    } catch (err) {
      if (subscriptionsEnabled && isApiErrorWithStatus(err, 403)) {
        setIsLimitReachedOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : 'Error al analizar la comida');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToLibrary = (data: SaveMealLibraryItemData) => {
    saveToLibrary(data)
      .then(() => toast.success('¡Guardado en tu biblioteca! ✅'))
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Error al guardar en la biblioteca'));
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
          onClick={() => void loadMeals()}
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
        <MealLogger
          isSaving={isSaving}
          onSave={handleSave}
          libraryItems={libraryItems}
          onSaveToLibrary={handleSaveToLibrary}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyze}
        />
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
      <FloatingCoachButton onClick={() => navigate('/chat')} />
      {subscriptionsEnabled && (
        <AILimitReached
          open={isLimitReachedOpen}
          onOpenChange={setIsLimitReachedOpen}
          feature="mealAnalysis"
          onUpgrade={() => navigate('/suscripcion')}
        />
      )}
    </div>
  );
}

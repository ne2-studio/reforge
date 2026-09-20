import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { isApiErrorWithStatus } from '@/api';
import { Button } from '@/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/design-system/components/ui/dialog';
import { useMealsStore } from '@/store/mealsStore';
import { useMealLibraryStore } from '@/store/mealLibraryStore';
import { useFeaturesStore } from '@/store/featuresStore';
import { loadMeals, logMeal, analyzeAndLogMeal } from '../useCases';
import { loadLibrary, saveToLibrary } from '@/features/mealLibrary/useCases';
import { MealLogger } from '../components/MealLogger';
import { MealHistory } from '../components/MealHistory';
import { FloatingCoachButton } from '@/features/coach/components/FloatingCoachButton';
import { AILimitReached } from '@/features/subscription/components/AILimitReached';
import type { AnalyzeMealData, SaveMealData, SaveMealLibraryItemData } from '@/types';

// Container for /comidas. Loads the caller's meals through the meals store on mount. The
// "Resumen de hoy" daily-stats card used to live here too — it now renders on /home
// (features/home), which loads dailyStats itself; logMeal/analyzeAndLogMeal below still
// refresh the shared mealsStore.dailyStats after a save so that card stays current. Shows the
// full meal history (last week, most recent day first) via the same MealHistory widget the
// /historial "Comidas" tab used to own; day-close and weekly progress live at /historial
// (features/history, Slice 7). MealLogger is a modal (Dialog), matching /actividad's
// button+modal pattern instead of an inline form.
export function MealsRoute() {
  const navigate = useNavigate();
  const { meals, isLoading, error } = useMealsStore();
  const { items: libraryItems } = useMealLibraryStore();
  const { subscriptions: subscriptionsEnabled } = useFeaturesStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLimitReachedOpen, setIsLimitReachedOpen] = useState(false);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);

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
      setIsLoggerOpen(false);
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
      setIsLoggerOpen(false);
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Comidas</h1>
          <Dialog open={isLoggerOpen} onOpenChange={setIsLoggerOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 gap-2">
                <Plus className="h-5 w-5" />
                Registrar comida
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogTitle className="sr-only">Registrar comida</DialogTitle>
              <MealLogger
                isSaving={isSaving}
                onSave={handleSave}
                libraryItems={libraryItems}
                onSaveToLibrary={handleSaveToLibrary}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyze}
              />
            </DialogContent>
          </Dialog>
        </div>
        <MealHistory meals={meals} isLoading={isLoading} />
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

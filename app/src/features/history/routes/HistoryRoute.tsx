import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/components/ui/tabs';
import { useMealsStore } from '@/store/mealsStore';
import { useWeeklyProgressStore } from '@/store/weeklyProgressStore';
import { loadMeals } from '@/features/meals/useCases';
import { loadWeeklyProgress } from '../useCases';
import { MealHistory } from '../components/MealHistory';
import { WeeklyProgress } from '../components/WeeklyProgress';

// Container for /historial. Loads meals (shared with /comidas via mealsStore) plus weekly
// progress on mount, and holds the tab state — see docs/architecture/frontend.md's `routes/`
// layer.
export function HistoryRoute() {
  const { meals, isLoading: isLoadingMeals } = useMealsStore();
  const { weeklyProgress, isLoading: isLoadingWeeklyProgress } = useWeeklyProgressStore();

  useEffect(() => {
    void loadMeals();
    void loadWeeklyProgress();
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Historial</h1>

        <Tabs defaultValue="comidas">
          <TabsList>
            <TabsTrigger value="comidas">Comidas</TabsTrigger>
            <TabsTrigger value="progreso-semanal">Progreso semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="comidas">
            <MealHistory meals={meals} isLoading={isLoadingMeals} />
          </TabsContent>

          <TabsContent value="progreso-semanal">
            <WeeklyProgress weeklyProgress={weeklyProgress} isLoading={isLoadingWeeklyProgress} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

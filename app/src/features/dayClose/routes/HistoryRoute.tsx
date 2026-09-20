import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/components/ui/tabs';
import { useMealsStore } from '@/store/mealsStore';
import { useClosedDaysStore } from '@/store/closedDaysStore';
import { loadMeals, todayDateString } from '@/features/meals/useCases';
import { loadDayHistory, loadWeeklyProgress, closeDay } from '../useCases';
import { MealHistory } from '../components/MealHistory';
import { DayHistory } from '../components/DayHistory';
import { WeeklyProgress } from '../components/WeeklyProgress';

// Container for /historial. Loads meals (shared with /comidas via mealsStore) plus day history
// and weekly progress on mount, holds the tab state, and wires the "Cerrar día" button to the
// closeDay use case — see docs/architecture/frontend.md's `routes/` layer.
export function HistoryRoute() {
  const { meals, isLoading: isLoadingMeals } = useMealsStore();
  const { dayHistory, weeklyProgress, isLoading: isLoadingClosedDays } = useClosedDaysStore();
  const [isClosingToday, setIsClosingToday] = useState(false);

  useEffect(() => {
    void loadMeals();
    void loadDayHistory();
    void loadWeeklyProgress();
  }, []);

  const today = todayDateString();
  const todayHasMeals = meals.some((meal) => meal.date === today);
  const todaysClosedDay = dayHistory.find((day) => day.date === today) ?? null;

  const handleCloseDay = async () => {
    setIsClosingToday(true);
    try {
      await closeDay();
      toast.success('¡Día cerrado! ✅');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cerrar el día');
    } finally {
      setIsClosingToday(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Historial</h1>

        <Tabs defaultValue="comidas">
          <TabsList>
            <TabsTrigger value="comidas">Comidas</TabsTrigger>
            <TabsTrigger value="dias-cerrados">Días cerrados</TabsTrigger>
            <TabsTrigger value="progreso-semanal">Progreso semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="comidas">
            <MealHistory
              meals={meals}
              isLoading={isLoadingMeals}
              todayHasMeals={todayHasMeals}
              isTodayClosed={todaysClosedDay !== null}
              todayAnalysis={todaysClosedDay?.analysis ?? null}
              isClosingToday={isClosingToday}
              onCloseDay={() => void handleCloseDay()}
            />
          </TabsContent>

          <TabsContent value="dias-cerrados">
            <DayHistory days={dayHistory} isLoading={isLoadingClosedDays} />
          </TabsContent>

          <TabsContent value="progreso-semanal">
            <WeeklyProgress weeklyProgress={weeklyProgress} isLoading={isLoadingClosedDays} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

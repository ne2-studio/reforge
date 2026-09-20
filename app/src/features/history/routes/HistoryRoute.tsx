import { useEffect } from 'react';
import { useWeeklyProgressStore } from '@/store/weeklyProgressStore';
import { loadWeeklyProgress } from '../useCases';
import { WeeklyProgress } from '../components/WeeklyProgress';

// Container for /historial. Full meal history now lives at /comidas (features/meals) — this
// route only shows weekly progress, so it no longer needs mealsStore or a tab layout.
export function HistoryRoute() {
  const { weeklyProgress, isLoading: isLoadingWeeklyProgress } = useWeeklyProgressStore();

  useEffect(() => {
    void loadWeeklyProgress();
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Progreso semanal</h1>
        <WeeklyProgress weeklyProgress={weeklyProgress} isLoading={isLoadingWeeklyProgress} />
      </div>
    </div>
  );
}

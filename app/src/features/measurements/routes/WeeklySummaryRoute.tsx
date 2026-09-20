import { useEffect } from "react";
import { useWeeklyProgressStore } from "@/store/weeklyProgressStore";
import { loadWeeklyProgress } from "../useCases";
import { WeeklyProgress } from "../components/WeeklyProgress";

// Container for /progreso/semanal — the old standalone /historial route, folded into "Progreso"
// and now split back out into its own top-level nav entry alongside "Medidas y evolución".
export function WeeklySummaryRoute() {
  const { weeklyProgress, isLoading } = useWeeklyProgressStore();

  useEffect(() => {
    void loadWeeklyProgress();
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <WeeklyProgress weeklyProgress={weeklyProgress} isLoading={isLoading} />
      </div>
    </div>
  );
}

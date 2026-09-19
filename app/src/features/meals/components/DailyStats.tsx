import type { DailyStats as DailyStatsData } from '@/types';

interface DailyStatsProps {
  dailyStats: DailyStatsData | null;
  isLoading: boolean;
}

// Presentational — no react-router-dom/store/useCases imports. Ported directly from
// reforge-frontend/src/components/DailyStats.tsx, adapted to read `dailyStats`/`isLoading`
// as props instead of the old `useUserStore`/`useMealStore` Zustand hooks — MealsRoute reads
// mealsStore and passes both down.
export function DailyStats({ dailyStats, isLoading }: DailyStatsProps) {
  const consumed = dailyStats?.consumed ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const targets = dailyStats?.targets ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };

  if (isLoading && !dailyStats) {
    return (
      <div className="bg-card rounded-2xl p-6 border-2 border-border animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border-2 border-border">
      <h3 className="text-lg mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        Resumen de hoy
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Calorías</p>
          <p className="text-2xl text-primary">
            {Math.round(consumed.calories)} / {targets.calories}
          </p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
          <p className="text-xs text-muted-foreground mb-1">Proteínas</p>
          <p className="text-2xl text-accent">
            {Math.round(consumed.protein)} / {targets.protein}
          </p>
          <p className="text-xs text-muted-foreground">gramos</p>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <p className="text-xs text-muted-foreground mb-1">Carbohidratos</p>
          <p className="text-2xl text-blue-400">
            {Math.round(consumed.carbs)} / {targets.carbs}
          </p>
          <p className="text-xs text-muted-foreground">gramos</p>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
          <p className="text-xs text-muted-foreground mb-1">Grasas</p>
          <p className="text-2xl text-yellow-400">
            {Math.round(consumed.fats)} / {targets.fats}
          </p>
          <p className="text-xs text-muted-foreground">gramos</p>
        </div>
      </div>
    </div>
  );
}

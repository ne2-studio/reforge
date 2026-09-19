import React from "react";
import { useUserStore } from "../store/useUserStore";
import { useMealStore } from "../store/useMealStore";

interface DailyStatsProps {
}

export const DailyStats: React.FC<DailyStatsProps> = () => {
  const { profile } = useUserStore();
  const { dailyStats, isLoadingStats } = useMealStore();
  
  if (!profile) return null;

  const caloriesTarget = dailyStats?.targets?.calories || 0;
  const proteinTarget = dailyStats?.targets?.protein || 0;
  const carbsTarget = dailyStats?.targets?.carbs || 0;
  const fatsTarget = dailyStats?.targets?.fats || 0;

  const totals = dailyStats?.consumed || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  if (isLoadingStats && !dailyStats) {
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
            {Math.round(totals.calories)} / {caloriesTarget}
          </p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
          <p className="text-xs text-muted-foreground mb-1">Proteínas</p>
          <p className="text-2xl text-accent">
            {Math.round(totals.protein)} / {proteinTarget}
          </p>
          <p className="text-xs text-muted-foreground">gramos</p>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <p className="text-xs text-muted-foreground mb-1">Carbohidratos</p>
          <p className="text-2xl text-blue-400">
            {Math.round(totals.carbs)} / {carbsTarget}
          </p>
          <p className="text-xs text-muted-foreground">gramos</p>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
          <p className="text-xs text-muted-foreground mb-1">Grasas</p>
          <p className="text-2xl text-yellow-400">
            {Math.round(totals.fats)} / {fatsTarget}
          </p>
          <p className="text-xs text-muted-foreground">gramos</p>
        </div>
      </div>
    </div>
  );
};

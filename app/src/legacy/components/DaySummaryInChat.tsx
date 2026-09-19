import { TrendingUp, Utensils, Target } from "lucide-react";

interface DaySummaryInChatProps {
  todaysMeals: any[];
  dailyMenu: any;
}

export function DaySummaryInChat({ todaysMeals, dailyMenu }: DaySummaryInChatProps) {
  const totalCalories = todaysMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const targetCalories = dailyMenu?.totalCalories?.match(/\d+/) ? parseInt(dailyMenu.totalCalories.match(/\d+/)[0]) : null;
  const remaining = targetCalories ? targetCalories - totalCalories : null;
  const progress = targetCalories ? Math.min((totalCalories / targetCalories) * 100, 100) : 0;

  return (
    <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg p-4 border border-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-accent" />
          Resumen de hoy
        </h4>
        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
          {dailyMenu?.isTrainingDay ? '💪 Entrenamiento' : '🧘 Descanso'}
        </span>
      </div>

      {/* Calorie Progress */}
      {targetCalories ? (
        <div className="space-y-2">
          <div className="flex justify-between items-baseline text-sm">
            <span className="text-muted-foreground">Calorías</span>
            <span className="font-mono">
              <span className="text-accent">{totalCalories}</span>
              <span className="text-muted-foreground"> / {targetCalories}</span>
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {remaining !== null && (
            <p className="text-xs text-muted-foreground">
              {remaining > 0 ? (
                <>Quedan <span className="text-accent">{remaining} cal</span></>
              ) : (
                <>Superado en <span className="text-accent">{Math.abs(remaining)} cal</span></>
              )}
            </p>
          )}
        </div>
      ) : null}

      {/* Meals count */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Comidas</span>
        </div>
        <span className="text-accent font-medium">{todaysMeals.length}</span>
      </div>
    </div>
  );
}

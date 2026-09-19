import { useEffect, useState } from "react";
import { TrendingUp, MessageCircle, Utensils, Target } from "lucide-react";
import { Button } from "./ui/button";

interface DayProgressCardProps {
  todaysMeals: any[];
  dailyMenu: any;
  onOpenChat: () => void;
}

export function DayProgressCard({ todaysMeals, dailyMenu, onOpenChat }: DayProgressCardProps) {
  const [totalCalories, setTotalCalories] = useState(0);
  const [targetCalories, setTargetCalories] = useState<number | null>(null);

  useEffect(() => {
    // Calculate total calories from today's meals
    const total = todaysMeals.reduce((sum, meal) => sum + (meal.analysis?.calories || 0), 0);
    setTotalCalories(total);

    // Extract target calories from menu
    if (dailyMenu?.totalCalories) {
      const match = dailyMenu.totalCalories.match(/(\d+)/);
      if (match) {
        setTargetCalories(parseInt(match[0]));
      }
    }
  }, [todaysMeals, dailyMenu]);

  const remaining = targetCalories ? targetCalories - totalCalories : null;
  const progress = targetCalories ? Math.min((totalCalories / targetCalories) * 100, 100) : 0;

  // Detectar la categoría correcta basándose en la hora registrada
  const getCategoryByTime = (time: string, savedCategory: string) => {
    if (!time) return savedCategory;
    
    try {
      const [hours] = time.split(':').map(Number);
      
      if (hours >= 4 && hours < 10) {
        return "breakfast";
      } else if (hours >= 10 && hours < 13) {
        return "mid-morning";
      } else if (hours >= 13 && hours < 17) {
        return "lunch";
      } else if (hours >= 17 && hours < 20) {
        return "snack";
      } else {
        return "dinner";
      }
    } catch (error) {
      console.error("Error parsing time:", time, error);
      return savedCategory;
    }
  };

  // Count meals by category using time detection
  const mealCategories = {
    breakfast: todaysMeals.filter(m => getCategoryByTime(m.time, m.category) === 'breakfast').length,
    midMorning: todaysMeals.filter(m => getCategoryByTime(m.time, m.category) === 'mid-morning').length,
    lunch: todaysMeals.filter(m => getCategoryByTime(m.time, m.category) === 'lunch').length,
    snack: todaysMeals.filter(m => getCategoryByTime(m.time, m.category) === 'snack').length,
    dinner: todaysMeals.filter(m => getCategoryByTime(m.time, m.category) === 'dinner').length,
  };

  const totalMealsExpected = 3; // Principales: desayuno, comida, cena
  const totalMealsLogged = todaysMeals.length;

  // Determine if user needs coaching nudge
  const needsNudge = totalMealsLogged === 0 || (targetCalories && remaining && remaining > targetCalories * 0.6);

  return (
    <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-xl p-5 border border-accent/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Resumen del día
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {dailyMenu?.isTrainingDay ? '💪 Día de entrenamiento' : '🧘 Día de descanso'}
          </p>
        </div>
        {needsNudge && (
          <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent animate-pulse">
            ¡Atención!
          </span>
        )}
      </div>

      {/* Calorie Progress */}
      {targetCalories ? (
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Calorías</span>
            <span className="font-mono">
              <span className="text-accent">{totalCalories}</span>
              <span className="text-muted-foreground"> / {targetCalories} cal</span>
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {remaining !== null && (
            <p className="text-xs text-muted-foreground">
              {remaining > 0 ? (
                <>Te quedan <span className="text-accent font-medium">{remaining} cal</span> para completar tu objetivo</>
              ) : (
                <>Has superado tu objetivo en <span className="text-accent font-medium">{Math.abs(remaining)} cal</span></>
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <Target className="h-4 w-4 inline mr-1" />
            Genera tu menú del día para ver tu objetivo calórico
          </p>
        </div>
      )}

      {/* Meals logged */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Comidas registradas</span>
        </div>
        <span className="text-sm">
          <span className="text-accent font-medium">{totalMealsLogged}</span>
          <span className="text-muted-foreground"> / {totalMealsExpected}</span>
        </span>
      </div>

      {/* Meal breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1">🌅 Desayuno</div>
          <div className={`text-sm font-medium ${mealCategories.breakfast > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
            {mealCategories.breakfast > 0 ? '✓' : '−'}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1">☀️ Comida</div>
          <div className={`text-sm font-medium ${mealCategories.lunch > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
            {mealCategories.lunch > 0 ? '✓' : '−'}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1">🌙 Cena</div>
          <div className={`text-sm font-medium ${mealCategories.dinner > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
            {mealCategories.dinner > 0 ? '✓' : '−'}
          </div>
        </div>
      </div>

      {/* Optional meals */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/20">
          <div className="text-xs text-muted-foreground mb-1">☕ M. Mañana</div>
          <div className={`text-sm font-medium ${mealCategories.midMorning > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
            {mealCategories.midMorning > 0 ? '✓' : '−'}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/20">
          <div className="text-xs text-muted-foreground mb-1">🍎 Merienda</div>
          <div className={`text-sm font-medium ${mealCategories.snack > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
            {mealCategories.snack > 0 ? '✓' : '−'}
          </div>
        </div>
      </div>

      {/* Call to action */}
      <Button
        onClick={onOpenChat}
        className="w-full"
        variant={needsNudge ? "default" : "outline"}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {needsNudge ? '¿Necesitas ayuda? Pregunta al coach' : 'Pregunta al coach'}
      </Button>

      {needsNudge && totalMealsLogged === 0 && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          💡 Aún no has registrado comidas hoy
        </p>
      )}
    </div>
  );
}

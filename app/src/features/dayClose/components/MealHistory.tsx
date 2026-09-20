import { Button } from '@/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import { CalendarCheck, Loader2 } from 'lucide-react';
import type { Meal } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  'mid-morning': 'Media mañana',
  lunch: 'Comida',
  snack: 'Merienda',
  dinner: 'Cena',
};

interface MealDayGroup {
  date: string;
  meals: Meal[];
  totalCalories: number;
}

interface MealHistoryProps {
  meals: Meal[];
  isLoading: boolean;
  todayHasMeals: boolean;
  isTodayClosed: boolean;
  todayAnalysis: string | null;
  isClosingToday: boolean;
  onCloseDay: () => void;
}

function formatDayHeading(date: string): string {
  // meal.date/day group keys are yyyy-MM-dd strings — parsed as local, not UTC, so "hoy"/"ayer"
  // line up with the user's own calendar day (same reasoning as meals/useCases's
  // todayDateString()).
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (parsed.toDateString() === today.toDateString()) return 'Hoy';
  if (parsed.toDateString() === yesterday.toDateString()) return 'Ayer';
  return parsed.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(meals: Meal[]): MealDayGroup[] {
  const groups = new Map<string, Meal[]>();
  for (const meal of meals) {
    const existing = groups.get(meal.date);
    if (existing) {
      existing.push(meal);
    } else {
      groups.set(meal.date, [meal]);
    }
  }

  // GET /api/meals is already most-recent-first, so Map insertion order preserves it —
  // meals belonging to the same day stay adjacent without a re-sort.
  return Array.from(groups.entries()).map(([date, dayMeals]) => ({
    date,
    meals: dayMeals,
    totalCalories: dayMeals.reduce((sum, meal) => sum + meal.calories, 0),
  }));
}

// Presentational — no react-router-dom/store/useCases imports. "Comidas" tab of /historial:
// full meal history grouped by calendar day (most recent first), plus today's close-day
// status — a "Cerrar día" button when today isn't closed yet and has meals logged (mirrors the
// backend's own guard so the button doesn't need to 400 needlessly), or today's analysis text
// once it is closed.
export function MealHistory({
  meals,
  isLoading,
  todayHasMeals,
  isTodayClosed,
  todayAnalysis,
  isClosingToday,
  onCloseDay,
}: MealHistoryProps) {
  const days = groupByDay(meals);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Cierre del día
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTodayClosed && todayAnalysis !== null ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{todayAnalysis}</p>
          ) : todayHasMeals ? (
            <Button onClick={onCloseDay} disabled={isClosingToday} className="gap-2">
              {isClosingToday ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cerrar día
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Registra al menos una comida hoy para poder cerrar el día.
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading && meals.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : days.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">Aún no has registrado comidas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <Card key={day.date} className="border-2 border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize text-base">{formatDayHeading(day.date)}</CardTitle>
                  <span className="text-sm text-muted-foreground">{day.totalCalories} kcal</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {day.meals.map((meal) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

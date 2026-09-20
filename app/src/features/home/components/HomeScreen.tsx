import { Flame, Plus, Target, Utensils } from 'lucide-react';
import { Button } from '@/design-system/components/ui/button';
import { Card, CardContent } from '@/design-system/components/ui/card';
import { estimateCalories } from '@/features/activities/calorieEstimate';
import type { Activity, Meal, UserProfile } from '@/types';

const GOAL_LABELS: Record<string, string> = {
  'lose-fat': 'Perder grasa',
  'gain-muscle': 'Ganar músculo',
  recomp: 'Recomposición',
  maintain: 'Mantener',
};

const GOAL_EMOJIS: Record<string, string> = {
  'lose-fat': '🔥',
  'gain-muscle': '💪',
  recomp: '⚡',
  maintain: '🎯',
};

const MEAL_CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  'mid-morning': 'Media mañana',
  lunch: 'Comida',
  snack: 'Merienda',
  dinner: 'Cena',
};

const ACTIVITY_LABELS: Record<string, string> = {
  strength: 'Entreno de fuerza',
  cardio: 'Sesión de cardio',
  neat: 'NEAT',
};

interface HomeScreenProps {
  profile: UserProfile | null;
  todaysMeals: Meal[];
  isLoadingMeals: boolean;
  activities: Activity[];
  isLoadingActivities: boolean;
  streak: number | null;
  isLoadingStreak: boolean;
  onNavigateToMeals: () => void;
  onNavigateToActivity: () => void;
}

// Presentational — no react-router-dom/store/useCases imports, following this repo's
// container-vs-presentational split. Ported from the prototype's home tab (App.tsx): a goal
// banner plus "Comidas de hoy", "Registro de actividad" and "Racha" module cards, trimmed to a
// summary (full logging UI already lives at /comidas and /actividad, no need to duplicate it
// here).
export function HomeScreen({
  profile,
  todaysMeals,
  isLoadingMeals,
  activities,
  isLoadingActivities,
  streak,
  isLoadingStreak,
  onNavigateToMeals,
  onNavigateToActivity,
}: HomeScreenProps) {
  const recentActivities = activities.slice(0, 3);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {profile?.goal && (
          <div className="bg-gradient-to-br from-primary/20 via-primary/15 to-accent/20 rounded-2xl p-4 border-2 border-primary/40 shadow-lg shadow-primary/20 flex items-center gap-3">
            <div className="text-4xl">{GOAL_EMOJIS[profile.goal] ?? '🎯'}</div>
            <div>
              <h2 className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                {GOAL_LABELS[profile.goal] ?? profile.goal}
              </h2>
              <p className="text-xs text-muted-foreground">Tu objetivo principal</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 border-border">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Utensils className="h-4 w-4 text-accent" />
                Comidas de hoy
              </h3>

              <Button variant="default" className="w-full justify-start gap-2" onClick={onNavigateToMeals}>
                <Plus className="h-4 w-4" />
                Registrar comida
              </Button>

              {isLoadingMeals ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : todaysMeals.length > 0 ? (
                <div className="space-y-2">
                  {todaysMeals.map((meal) => (
                    <div key={meal.id} className="rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {MEAL_CATEGORY_LABELS[meal.category] ?? meal.category}
                        </span>
                        <span className="text-xs text-muted-foreground">{meal.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{meal.mealText}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no has registrado ninguna comida hoy.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Registro de actividad
              </h3>

              <Button variant="default" className="w-full justify-start gap-2" onClick={onNavigateToActivity}>
                <Plus className="h-4 w-4" />
                Registrar actividad
              </Button>

              {isLoadingActivities ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-2">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">{ACTIVITY_LABELS[activity.type] ?? activity.type}</span>
                      <span className="text-xs text-muted-foreground">{estimateCalories(activity)} kcal</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no has registrado ninguna actividad.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 overflow-hidden">
            <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Racha</h3>
            </div>
            <div className="p-6 text-center">
              <div className="text-5xl font-bold text-primary mb-2">{isLoadingStreak ? '–' : (streak ?? 0)}</div>
              <p className="text-muted-foreground">Días seguidos cumpliendo</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

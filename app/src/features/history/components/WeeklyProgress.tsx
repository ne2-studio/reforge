import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import { Calendar, CheckCircle2, Flame, Lightbulb, Loader2, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import type { WeeklyProgress as WeeklyProgressData } from '@/types';

interface WeeklyProgressProps {
  weeklyProgress: WeeklyProgressData | null;
  isLoading: boolean;
}

function getDayName(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
}

function getDayNumber(dateStr: string): number {
  const [, , day] = dateStr.split('-').map(Number);
  return day;
}

function isToday(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.toDateString() === new Date().toDateString();
}

// Presentational — no react-router-dom/store/useCases imports. "Progreso semanal" tab of
// /historial: GET /weekly-progress's summary (total deficit/surplus, daily average,
// days-in-deficit vs days-in-surplus, adherence streak, insights) plus a per-day breakdown.
// Layout/copy ideas borrowed from legacy/components/WeeklyProgress.tsx (Spanish day-name/
// number formatting, deficit-vs-superávit badge styling) — not its AI-coach-analysis bits,
// which this backend doesn't have, and not imported from `legacy/` directly.
export function WeeklyProgress({ weeklyProgress, isLoading }: WeeklyProgressProps) {
  if (isLoading && weeklyProgress === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (weeklyProgress === null || weeklyProgress.days.length === 0) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Progreso semanal
          </CardTitle>
          <CardDescription>Resumen de tu semana y patrones de adherencia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm">
              Registra tus comidas durante la semana para ver tu progreso, patrones y recibir insights
              personalizados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOverallDeficit = weeklyProgress.totalDeficit < 0;
  const averageDaily =
    weeklyProgress.daysWithMeals > 0
      ? Math.abs(Math.round(weeklyProgress.totalDeficit / weeklyProgress.daysWithMeals))
      : 0;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Resumen semanal
          </CardTitle>
          <CardDescription>Tu progreso de los últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-4 border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">Déficit total</div>
              </div>
              <div className={`text-2xl font-bold ${isOverallDeficit ? 'text-primary' : 'text-destructive'}`}>
                {Math.abs(Math.round(weeklyProgress.totalDeficit))} kcal
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isOverallDeficit ? 'En déficit' : 'En superávit'}
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-accent" />
                <div className="text-xs text-muted-foreground">Promedio diario</div>
              </div>
              <div className={`text-2xl font-bold ${isOverallDeficit ? 'text-accent' : 'text-destructive'}`}>
                {averageDaily} kcal
              </div>
              <div className="text-xs text-muted-foreground mt-1">Por día</div>
            </div>

            <div className="bg-background rounded-lg p-4 border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xs text-muted-foreground">Balance</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold text-primary">{weeklyProgress.daysInDeficit}</span>
                </div>
                <span className="text-muted-foreground text-sm">vs</span>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-xl font-bold text-destructive">{weeklyProgress.daysInSurplus}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Déficit vs superávit</div>
            </div>

            <div className="bg-background rounded-lg p-4 border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-accent" />
                <div className="text-xs text-muted-foreground">Racha</div>
              </div>
              <div className="text-2xl font-bold text-accent">
                {weeklyProgress.adherenceStreak} {weeklyProgress.adherenceStreak === 1 ? 'día' : 'días'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">De adherencia continua</div>
            </div>
          </div>

          {weeklyProgress.insights.length > 0 && (
            <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <h4 className="font-medium text-accent">Insights de tu semana</h4>
                  <ul className="space-y-1.5">
                    {weeklyProgress.insights.map((insight, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Desglose diario
          </CardTitle>
          <CardDescription>Calorías y déficit de cada día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyProgress.days.map((day) => {
              const isDeficit = day.deficit < 0;
              const deficitValue = Math.abs(day.deficit);
              const todayHighlight = isToday(day.date);
              const hasNoMeals = day.mealsCount === 0;

              return (
                <div
                  key={day.date}
                  className={`rounded-lg p-4 border-2 transition-all ${
                    todayHighlight
                      ? 'bg-primary/10 border-primary/40'
                      : hasNoMeals
                        ? 'bg-muted/10 border-border/50 opacity-60'
                        : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
                          todayHighlight ? 'bg-primary text-primary-foreground' : 'bg-background border-2 border-border'
                        }`}
                      >
                        <div className="text-xs font-medium">{getDayName(day.date)}</div>
                        <div className="text-lg font-bold">{getDayNumber(day.date)}</div>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{day.date}</span>
                          {todayHighlight && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                              Hoy
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {day.mealsCount} {day.mealsCount === 1 ? 'comida' : 'comidas'}
                        </span>
                      </div>
                    </div>

                    {hasNoMeals ? (
                      <div className="text-sm text-muted-foreground/70 italic">Sin comidas registradas</div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <div className="text-xs text-muted-foreground">Consumidas</div>
                          <div className="font-medium">{day.consumedCalories} kcal</div>
                        </div>

                        <div className="text-right hidden md:block">
                          <div className="text-xs text-muted-foreground">Objetivo</div>
                          <div className="font-medium">{day.targetCalories} kcal</div>
                        </div>

                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                            isDeficit ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30'
                          }`}
                        >
                          {isDeficit ? (
                            <TrendingDown className="h-4 w-4 text-primary" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-destructive" />
                          )}
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">{isDeficit ? 'Déficit' : 'Superávit'}</div>
                            <div className={`font-bold ${isDeficit ? 'text-primary' : 'text-destructive'}`}>
                              {deficitValue} kcal
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

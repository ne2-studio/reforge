import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Flame, 
  Target,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2
} from "lucide-react";
import { mealService } from "../services/meal.service";
import { useAuthStore } from "../store/useAuthStore";
import { useMealStore } from "../store/useMealStore";
import { useUserStore } from "../store/useUserStore";
import { UserProfile } from "../types";

interface WeeklyProgressProps {
}

interface DayData {
  date: string;
  targetCalories: number;
  consumedCalories: number;
  deficit: number;
  mealsCount: number;
  hasCoachAnalysis: boolean;
}

interface WeeklyData {
  days: DayData[];
  totalDeficit: number;
  daysInDeficit: number;
  daysInSurplus: number;
  daysWithMeals: number;
  adherenceStreak: number;
  insights: string[];
}

export function WeeklyProgress({ }: WeeklyProgressProps) {
  const { accessToken } = useAuthStore();
  const { profile: userProfile } = useUserStore();
  const { weeklyProgress: weeklyData, isLoadingWeekly: isLoading, fetchWeeklyProgress } = useMealStore();

  // Mover todos los useMemo al inicio, antes de cualquier return condicional
  const getDayName = useMemo(() => (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase();
  }, []);

  const getDayNumber = useMemo(() => (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate();
  }, []);

  const isToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    return (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toDateString() === todayStr;
    };
  }, []);

  useEffect(() => {
    fetchWeeklyProgress();
  }, []);

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!weeklyData || weeklyData.days.length === 0) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Progreso Semanal
          </CardTitle>
          <CardDescription>Resumen de tu semana y patrones de adherencia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-primary/10 rounded-full p-6 mb-4">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Comienza a registrar tu progreso</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Registra tus comidas durante la semana para ver tu progreso, patrones y recibir insights personalizados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen General de la Semana */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Resumen Semanal
          </CardTitle>
          <CardDescription>Tu progreso de los últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-4 border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">Déficit Total</div>
              </div>
              <div className={`text-2xl font-bold ${weeklyData.totalDeficit < 0 ? 'text-primary' : 'text-destructive'}`}>
                {Math.abs(Math.round(weeklyData.totalDeficit))} kcal
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {weeklyData.totalDeficit < 0 ? 'En déficit' : 'En superávit'}
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-4 border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-accent" />
                <div className="text-xs text-muted-foreground">Promedio Diario</div>
              </div>
              <div className={`text-2xl font-bold ${weeklyData.totalDeficit < 0 ? 'text-accent' : 'text-destructive'}`}>
                {weeklyData.daysWithMeals > 0 ? Math.abs(Math.round(weeklyData.totalDeficit / weeklyData.daysWithMeals)) : 0} kcal
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Por día
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <div className="text-xs text-muted-foreground">Balance</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold text-primary">{weeklyData.daysInDeficit}</span>
                </div>
                <span className="text-muted-foreground text-sm">vs</span>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-xl font-bold text-destructive">{weeklyData.daysInSurplus}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Déficit vs Superávit
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-accent" />
                <div className="text-xs text-muted-foreground">Racha</div>
              </div>
              <div className="text-2xl font-bold text-accent">
                {weeklyData.adherenceStreak} {weeklyData.adherenceStreak === 1 ? 'día' : 'días'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                De adherencia continua
              </div>
            </div>
          </div>

          {/* Insights automáticos */}
          {weeklyData.insights.length > 0 && (
            <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <h4 className="font-medium text-accent">Insights de tu semana</h4>
                  <ul className="space-y-1.5">
                    {weeklyData.insights.map((insight, index) => (
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

      {/* Vista de días individuales */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Desglose Diario
          </CardTitle>
          <CardDescription>Calorías y déficit de cada día</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyData.days.map((day) => {
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
                      : 'bg-muted/30 border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Día y fecha */}
                    <div className="flex items-center gap-3">
                      <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
                        todayHighlight ? 'bg-primary text-primary-foreground' : 'bg-background border-2 border-border'
                      }`}>
                        <div className="text-xs font-medium">{getDayName(day.date)}</div>
                        <div className="text-lg font-bold">{getDayNumber(day.date)}</div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {new Date(day.date).toLocaleDateString("es-ES", { 
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
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

                    {/* Calorías y déficit */}
                    {hasNoMeals ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground/70 italic">
                        <span className="text-muted-foreground/50">—</span>
                        <span>Sin comidas registradas</span>
                      </div>
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

                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                          isDeficit 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-destructive/10 border-destructive/30'
                        }`}>
                          {isDeficit ? (
                            <TrendingDown className="h-4 w-4 text-primary" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-destructive" />
                          )}
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {isDeficit ? 'Déficit' : 'Superávit'}
                            </div>
                            <div className={`font-bold ${isDeficit ? 'text-primary' : 'text-destructive'}`}>
                              {deficitValue} kcal
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Versión móvil de calorías */}
                  {!hasNoMeals && (
                    <div className="md:hidden mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Consumidas</div>
                        <div className="font-medium">{day.consumedCalories} kcal</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Objetivo</div>
                        <div className="font-medium">{day.targetCalories} kcal</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { DaySummary } from "./DaySummary";
import { Button } from "./ui/button";
import { mealService } from "../services/meal.service";
import { useAuthStore } from "../store/useAuthStore";
import { useMealStore } from "../store/useMealStore";

interface DayHistoryProps {
}

export function DayHistory({ }: DayHistoryProps) {
  const { accessToken } = useAuthStore();
  const { dayHistory: days, isLoadingHistory: isLoading, fetchDayHistory } = useMealStore();
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [selectedDayMenu, setSelectedDayMenu] = useState<any | null>(null);

  useEffect(() => {
    fetchDayHistory();
  }, []);

  useEffect(() => {
    if (days.length > 0 && !selectedDay && window.innerWidth >= 768) {
      setSelectedDay(days[0]);
    }
  }, [days]);

  useEffect(() => {
    if (selectedDay) {
      loadDayMenu(selectedDay.date);
    }
  }, [selectedDay]);

  const loadDayMenu = async (date: string) => {
    try {
      const data = await mealService.getDailyMenu(accessToken, date);
      setSelectedDayMenu(data.menu);
    } catch (error) {
      console.error("Error loading day menu:", error);
      setSelectedDayMenu(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    } else {
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      breakfast: "🌅 Desayuno",
      lunch: "☀️ Comida",
      snack: "🍎 Merienda",
      dinner: "🌙 Cena",
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border-2 border-border">
        <p className="text-sm text-muted-foreground">Cargando historial...</p>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border-2 border-border text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-medium mb-2">Sin historial aún</h3>
        <p className="text-sm text-muted-foreground">
          Cierra tu primer día para empezar a construir tu historial
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
      {/* Mobile: Lista vertical con detalles expandibles */}
      <div className="md:hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de días
          </h3>
        </div>
        <div className="divide-y divide-border">
          {days.map((day: any) => (
            <div key={day.date} className="p-4" id={`day-${day.date}`}>
              <button
                onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium capitalize">{formatDate(day.date)}</p>
                    <p className="text-xs text-muted-foreground">{day.date}</p>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      selectedDay?.date === day.date ? "rotate-90" : ""
                    }`}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{day.meals.length} comidas</span>
                  <span>{day.hadWorkout ? "💪 Entreno" : "😌 Descanso"}</span>
                  <span className="ml-auto">{Math.round(day.totals.calories)} kcal</span>
                </div>
              </button>

              {selectedDay?.date === day.date && (
                <div className="mt-4 space-y-4">
                  {/* Comidas */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Comidas registradas</h4>
                    <div className="space-y-2">
                      {day.meals.map((meal: any, index: number) => (
                        <div key={index} className="bg-muted/20 rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{getCategoryLabel(meal.category)}</span>
                            <span className="text-xs text-muted-foreground">{meal.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{meal.mealText}</p>
                          {meal.analysis && (
                            <div className="flex gap-3 text-xs">
                              <span className="text-primary">{meal.analysis.calories} kcal</span>
                              <span className="text-accent">{meal.analysis.protein}g prot</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Análisis del Coach */}
                  {selectedDay?.date === day.date && selectedDayMenu?.coachAnalysis && (
                    <div className="bg-accent/10 border-2 border-accent/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-accent/20 rounded-full p-1.5">
                          <span className="text-base">🤖</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-primary">Análisis del Coach</h4>
                          <p className="text-xs text-muted-foreground">
                            {selectedDayMenu.analysisTimestamp && 
                              new Date(selectedDayMenu.analysisTimestamp).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-xs whitespace-pre-wrap leading-relaxed">
                        {selectedDayMenu.coachAnalysis}
                      </div>
                    </div>
                  )}

                  {/* Resumen del coach */}
                  <DaySummary summary={day} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Dos columnas */}
      <div className="hidden md:grid md:grid-cols-5">
        {/* Lista de días */}
        <div className="col-span-2 border-r border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial
            </h3>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {days.map((day: any) => (
              <button
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                  selectedDay?.date === day.date ? "bg-primary/10 border-l-4 border-primary" : ""
                }`}
              >
                <p className="font-medium capitalize mb-1">{formatDate(day.date)}</p>
                <p className="text-xs text-muted-foreground mb-2">{day.date}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{day.meals.length} comidas</span>
                  <span>{day.hadWorkout ? "💪" : "😌"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalle del día seleccionado */}
        <div className="col-span-3">
          {selectedDay ? (
            <div className="p-6 max-h-[600px] overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xl font-medium capitalize mb-1">
                  {formatDate(selectedDay.date)}
                </h3>
                <p className="text-sm text-muted-foreground">{selectedDay.date}</p>
              </div>

              {/* Comidas */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Comidas registradas</h4>
                <div className="space-y-3">
                  {selectedDay.meals.map((meal: any, index: number) => (
                    <div key={index} className="bg-muted/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{getCategoryLabel(meal.category)}</span>
                        <span className="text-xs text-muted-foreground">{meal.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{meal.mealText}</p>
                      {meal.analysis && (
                        <div className="flex gap-4 text-sm">
                          <span className="text-primary">{meal.analysis.calories} kcal</span>
                          <span className="text-accent">{meal.analysis.protein}g prot</span>
                          <span className="text-blue-400">{meal.analysis.carbs}g carbs</span>
                          <span className="text-yellow-400">{meal.analysis.fats}g grasa</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Análisis del Coach */}
              {selectedDayMenu?.coachAnalysis && (
                <div className="mb-6 bg-accent/10 border-2 border-accent/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-accent/20 rounded-full p-2">
                      <span className="text-lg">🤖</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">Análisis del Coach</h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedDayMenu.analysisTimestamp && 
                          new Date(selectedDayMenu.analysisTimestamp).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedDayMenu.coachAnalysis}
                  </div>
                </div>
              )}

              {/* Resumen del coach */}
              <DaySummary summary={selectedDay} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Selecciona un día para ver los detalles
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

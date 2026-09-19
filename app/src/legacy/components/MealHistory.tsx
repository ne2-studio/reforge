import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { History, Utensils, Loader2, Calendar, BarChart3, TrendingUp, Library } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { WeeklyProgress } from "./WeeklyProgress";
import { toast } from "sonner";
import { mealService } from "../services/meal.service";
import { useAuthStore } from "../store/useAuthStore";
import { useMealStore } from "../store/useMealStore";
import { useUserStore } from "../store/useUserStore";
import { Meal } from "../types";

interface MealHistoryProps {
}

export function MealHistory({ }: MealHistoryProps) {
  const { accessToken } = useAuthStore();
  const { profile: userProfile } = useUserStore();
  const { meals, isLoadingMeals: isLoading, fetchMeals, addToLibrary } = useMealStore();
  const [activeTab, setActiveTab] = useState("history");
  const [savingMealIndex, setSavingMealIndex] = useState<string | null>(null);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [libraryMealData, setLibraryMealData] = useState({
    title: "",
    description: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  useEffect(() => {
    fetchMeals();
  }, []);

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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      breakfast: "🌅 Desayuno",
      "mid-morning": "☕ Media mañana",
      lunch: "☀️ Comida",
      snack: "🍎 Merienda",
      dinner: "🌙 Cena",
      // Compatibilidad con categorías antiguas en español
      desayuno: "🌅 Desayuno",
      comida: "☀️ Comida",
      merienda: "🍎 Merienda",
      cena: "🌙 Cena",
    };
    return labels[category] || category;
  };

  const getCategoryOrder = (category: string) => {
    const order: Record<string, number> = {
      breakfast: 1,
      desayuno: 1,
      "mid-morning": 2,
      lunch: 3,
      comida: 3,
      snack: 4,
      merienda: 4,
      dinner: 5,
      cena: 5,
    };
    return order[category] || 6;
  };

  const handleSaveToLibrary = async () => {
    if (!selectedMeal || !libraryMealData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    setSavingMealIndex("dialog");
    try {
      const categoryPlain = getCategoryByTime(selectedMeal.time, selectedMeal.category);
      await mealService.addToLibrary(accessToken, {
        title: libraryMealData.title,
        description: libraryMealData.description || selectedMeal.mealText,
        category: getCategoryLabel(categoryPlain).replace(/🌅|☕|☀️|🍎|🌙/g, "").trim(),
        calories: parseFloat(libraryMealData.calories) || selectedMeal.analysis?.calories || 0,
        protein: parseFloat(libraryMealData.protein) || selectedMeal.analysis?.protein || 0,
        carbs: parseFloat(libraryMealData.carbs) || selectedMeal.analysis?.carbs || 0,
        fats: parseFloat(libraryMealData.fats) || selectedMeal.analysis?.fats || 0,
      });

      toast.success("✅ ¡Comida guardada en tu biblioteca!");
      setLibraryDialogOpen(false);
      setSelectedMeal(null);
      setLibraryMealData({
        title: "",
        description: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
      });
    } catch (error: any) {
      console.error("Error saving to library:", error);
      toast.error(error.message || "Error al conectar");
    } finally {
      setSavingMealIndex(null);
    }
  };

  const openSaveDialog = (meal: Meal) => {
    setSelectedMeal(meal);
    setLibraryMealData({
      title: "",
      description: meal.mealText,
      calories: meal.analysis?.calories.toString() || "",
      protein: meal.analysis?.protein.toString() || "",
      carbs: meal.analysis?.carbs.toString() || "",
      fats: meal.analysis?.fats.toString() || "",
    });
    setLibraryDialogOpen(true);
  };

  // Group meals by day
  const mealsByDay = meals.reduce((acc, meal) => {
    const date = new Date(meal.timestamp).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  // Sort days (most recent first) and meals within each day by category
  const sortedDays = Object.keys(mealsByDay).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  sortedDays.forEach(day => {
    mealsByDay[day].sort((a, b) => 
      getCategoryOrder(getCategoryByTime(a.time, a.category)) - getCategoryOrder(getCategoryByTime(b.time, b.category))
    );
  });
  
  console.log('MealHistory - Total meals:', meals.length);
  console.log('MealHistory - Days with meals:', sortedDays.length);
  console.log('MealHistory - First 3 days:', sortedDays.slice(0, 3));

  if (isLoading) {
    return (
      <Card className="border-2 border-accent/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  // Calculate totals for today
  const today = new Date().toDateString();
  const todaysMeals = meals.filter(
    (meal) => new Date(meal.timestamp).toDateString() === today
  );
  const todayTotals = todaysMeals.reduce(
    (acc, meal) => {
      if (meal.analysis) {
        acc.calories += meal.analysis.calories;
        acc.protein += meal.analysis.protein;
        acc.carbs += meal.analysis.carbs;
        acc.fats += meal.analysis.fats;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
        <TabsTrigger value="history" className="flex items-center gap-2" aria-label="Ver historial de comidas">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Historial</span>
          <span className="sm:hidden">Comidas</span>
        </TabsTrigger>
        <TabsTrigger value="weekly" className="flex items-center gap-2" aria-label="Ver progreso semanal">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Progreso Semanal</span>
          <span className="sm:hidden">Progreso</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="history" className="mt-0">
        <Card className="border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              Historial de comidas
            </CardTitle>
            <CardDescription>Tus comidas registradas con análisis nutricional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
        {todaysMeals.length > 0 && (
          <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h3 className="font-medium">Totales de hoy</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Calorías</div>
                <div className="text-accent font-medium">{Math.round(todayTotals.calories)} kcal</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Proteína</div>
                <div className="text-accent font-medium">{Math.round(todayTotals.protein)}g</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Carbos</div>
                <div className="text-accent font-medium">{Math.round(todayTotals.carbs)}g</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Grasas</div>
                <div className="text-accent font-medium">{Math.round(todayTotals.fats)}g</div>
              </div>
            </div>
          </div>
        )}

        {meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Utensils className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Aún no has registrado ninguna comida
              <br />
              Usa el formulario arriba para empezar
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDays.slice(0, 7).map((day) => {
              const dayMeals = mealsByDay[day];
              const dayTotals = dayMeals.reduce(
                (acc, meal) => {
                  if (meal.analysis) {
                    acc.calories += meal.analysis.calories;
                    acc.protein += meal.analysis.protein;
                    acc.carbs += meal.analysis.carbs;
                    acc.fats += meal.analysis.fats;
                  }
                  return acc;
                },
                { calories: 0, protein: 0, carbs: 0, fats: 0 }
              );

              return (
                <div key={day} className="space-y-3">
                  {/* Day header with date and totals */}
                  <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">
                          {new Date(day).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </h3>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dayMeals.length} {dayMeals.length === 1 ? "comida" : "comidas"}
                      </span>
                    </div>
                    {dayTotals.calories > 0 && (
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Cal:</span>{" "}
                          <span className="font-medium text-primary">{Math.round(dayTotals.calories)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prot:</span>{" "}
                          <span className="font-medium text-primary">{Math.round(dayTotals.protein)}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carbs:</span>{" "}
                          <span className="font-medium text-primary">{Math.round(dayTotals.carbs)}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Grasas:</span>{" "}
                          <span className="font-medium text-primary">{Math.round(dayTotals.fats)}g</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meals for this day */}
                  <div className="space-y-2 pl-2">
                    {dayMeals.map((meal, index) => (
                      <div
                        key={index}
                        className="bg-muted/30 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {getCategoryLabel(getCategoryByTime(meal.time, meal.category))}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {meal.time}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {meal.mealText}
                            </p>
                          </div>
                          <div>
                            <Button
                              size="icon"
                              className="bg-accent/10 hover:bg-accent/20"
                              onClick={() => openSaveDialog(meal)}
                            >
                              <Library className="h-4 w-4 text-accent" />
                            </Button>
                          </div>
                        </div>

                        {meal.analysis && (
                          <div className="border-t border-border pt-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                              <div>
                                <span className="text-xs text-muted-foreground">Calorías:</span>{" "}
                                <span className="font-medium">{meal.analysis.calories} kcal</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Proteína:</span>{" "}
                                <span className="font-medium">{meal.analysis.protein}g</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Carbos:</span>{" "}
                                <span className="font-medium">{meal.analysis.carbs}g</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Grasas:</span>{" "}
                                <span className="font-medium">{meal.analysis.fats}g</span>
                              </div>
                            </div>
                            {meal.analysis.feedback && (
                              <p className="text-xs text-muted-foreground italic border-l-2 border-accent pl-2">
                                {meal.analysis.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="weekly" className="mt-0">
        <WeeklyProgress 
          userProfile={userProfile}
        />
      </TabsContent>

      {/* Save to Library Dialog */}
      <Dialog open={libraryDialogOpen} onOpenChange={setLibraryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guardar en biblioteca</DialogTitle>
            <DialogDescription>
              Dale un nombre a esta comida para reutilizarla fácilmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mealTitle">Título *</Label>
              <Input
                id="mealTitle"
                placeholder='Ej: "Desayuno proteico habitual"'
                value={libraryMealData.title}
                onChange={(e) =>
                  setLibraryMealData({ ...libraryMealData, title: e.target.value })
                }
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealDescription">Descripción</Label>
              <Textarea
                id="mealDescription"
                value={libraryMealData.description}
                onChange={(e) =>
                  setLibraryMealData({ ...libraryMealData, description: e.target.value })
                }
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="libCalories">Calorías</Label>
                <Input
                  id="libCalories"
                  type="number"
                  step="1"
                  value={libraryMealData.calories}
                  onChange={(e) =>
                    setLibraryMealData({ ...libraryMealData, calories: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libProtein">Proteína (g)</Label>
                <Input
                  id="libProtein"
                  type="number"
                  step="0.1"
                  value={libraryMealData.protein}
                  onChange={(e) =>
                    setLibraryMealData({ ...libraryMealData, protein: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libCarbs">Carbohidratos (g)</Label>
                <Input
                  id="libCarbs"
                  type="number"
                  step="0.1"
                  value={libraryMealData.carbs}
                  onChange={(e) =>
                    setLibraryMealData({ ...libraryMealData, carbs: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libFats">Grasas (g)</Label>
                <Input
                  id="libFats"
                  type="number"
                  step="0.1"
                  value={libraryMealData.fats}
                  onChange={(e) =>
                    setLibraryMealData({ ...libraryMealData, fats: e.target.value })
                  }
                  className="h-12"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveToLibrary}
              disabled={savingMealIndex === "dialog"}
              className="w-full h-12"
            >
              {savingMealIndex === "dialog" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Library className="mr-2 h-4 w-4" />
                  Guardar en biblioteca
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
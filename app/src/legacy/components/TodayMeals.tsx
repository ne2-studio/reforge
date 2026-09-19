import { useState } from "react";
import { Plus, HelpCircle, CheckCircle, Library, Loader2 } from "lucide-react";
import { MealLogger } from "./MealLogger";
import { DayProgressCard } from "./DayProgressCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { toast } from "sonner";
import { mealService } from "../services/meal.service";

import { useAuthStore } from "../store/useAuthStore";
import { useMealStore } from "../store/useMealStore";

interface TodayMealsProps {
  onOpenChat?: () => void;
  onDayClosed?: () => void;
}

export function TodayMeals({ onOpenChat, onDayClosed }: TodayMealsProps) {
  const { accessToken } = useAuthStore();
  const { meals, isLoadingMeals, dailyMenu, addToLibrary } = useMealStore();
  const [showMealLogger, setShowMealLogger] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [libraryMealData, setLibraryMealData] = useState({
    title: "",
    description: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const today = new Date().toISOString().split('T')[0];
  
  // Filtrar comidas de hoy y ordenar por la hora que el usuario ingresó (time)
  const todaysMeals = meals
    .filter((meal: any) => {
      const mealDate = new Date(meal.timestamp).toISOString().split('T')[0];
      return mealDate === today;
    })
    .sort((a: any, b: any) => {
      // Convertir "HH:mm" a minutos desde medianoche para comparar
      const [hoursA, minutesA] = (a.time || '00:00').split(':').map(Number);
      const [hoursB, minutesB] = (b.time || '00:00').split(':').map(Number);
      const totalMinutesA = hoursA * 60 + minutesA;
      const totalMinutesB = hoursB * 60 + minutesB;
      return totalMinutesA - totalMinutesB;
    });

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

  // Simplificado: solo abre el chat con un mensaje
  const handleAskForDayFeedback = () => {
    if (onDayClosed) {
      onDayClosed();
    }
  };

  const openSaveDialog = (meal: any) => {
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

  const handleSaveToLibrary = async () => {
    if (!selectedMeal || !libraryMealData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    setSavingToLibrary(true);
    try {
      const categoryPlain = getCategoryByTime(selectedMeal.time, selectedMeal.category);
      await addToLibrary({
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
      setSavingToLibrary(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border-2 border-border">
      <h3 className="text-lg mb-4 flex items-center gap-2">
        <span className="text-2xl">🍽️</span>
        Comidas de hoy
      </h3>

      {/* Botones de acción principales */}
      <div className="mb-6 grid grid-cols-1 gap-3">
        {/* Mobile: Bottom Sheet para Registrar comida */}
        <div className="md:hidden">
          <Sheet open={showMealLogger} onOpenChange={setShowMealLogger}>
            <SheetTrigger asChild>
              <Button variant="default" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Registrar comida
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="overflow-y-auto">
              <SheetHeader className="pb-4">
                <SheetTitle>Registrar comida</SheetTitle>
                <SheetDescription>
                  Describe lo que comiste y te ayudaremos a calcular los macros
                </SheetDescription>
              </SheetHeader>
              <div className="pb-6">
                <MealLogger
                  onMealLogged={() => {
                    setShowMealLogger(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: Dialog para Registrar comida */}
        <div className="hidden md:block">
          <Dialog open={showMealLogger} onOpenChange={setShowMealLogger}>
            <DialogTrigger asChild>
              <Button variant="default" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Registrar comida
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar comida</DialogTitle>
                <DialogDescription>
                  Describe lo que comiste y te ayudaremos a calcular los macros
                </DialogDescription>
              </DialogHeader>
              <MealLogger
                onMealLogged={() => {
                  setShowMealLogger(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Pregunta al coach */}
        {onOpenChat && (
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={onOpenChat}
          >
            <HelpCircle className="h-4 w-4" />
            ¿Cómo voy?
          </Button>
        )}

        {/* Pedir feedback del día - Solo si hay comidas registradas */}
        {todaysMeals.length > 0 && onDayClosed && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleAskForDayFeedback}
          >
            <CheckCircle className="h-4 w-4" />
            Pedir feedback del día
          </Button>
        )}
      </div>

      {/* Day Progress Card - Resumen del progreso del día */}
      {dailyMenu && (
        <div className="mb-6">
          <DayProgressCard 
            todaysMeals={todaysMeals}
            dailyMenu={dailyMenu}
            onOpenChat={onOpenChat || (() => {})}
          />
        </div>
      )}

      {/* Lista de comidas */}
      {isLoadingMeals ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : todaysMeals.length > 0 ? (
        <div className="space-y-3">
          {todaysMeals.map((meal: any, index: number) => (
            <div
              key={meal.timestamp || index}
              className="rounded-lg p-4 bg-muted/30"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-accent/10 hover:bg-accent/20 shrink-0"
                  onClick={() => openSaveDialog(meal)}
                >
                  <Library className="h-4 w-4 text-accent" />
                </Button>
              </div>
              {meal.analysis && (
                <div className="border-t border-border pt-2 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Calorías:</span>{" "}
                      <span className="font-medium text-primary">
                        {meal.analysis.calories} kcal
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Proteína:</span>{" "}
                      <span className="font-medium text-accent">
                        {meal.analysis.protein}g
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aún no has registrado ninguna comida hoy.
        </p>
      )}

      {/* Dialog para guardar en biblioteca */}
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
              disabled={savingToLibrary}
              className="w-full h-12"
            >
              {savingToLibrary ? (
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
    </div>
  );
}
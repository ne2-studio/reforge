import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Library, Trash2, Loader2, Utensils, Coffee, Sun, Apple, Moon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { mealService } from "../services/meal.service";
import { useAuthStore } from "../store/useAuthStore";
import { useMealStore } from "../store/useMealStore";
import { LibraryMeal } from "../types";

interface MealLibraryProps {
  onMealSelected?: (meal: LibraryMeal) => void;
}

export function MealLibrary({ onMealSelected }: MealLibraryProps) {
  const { accessToken } = useAuthStore();
  const { libraryMeals: meals, isLoadingLibrary: isLoading, fetchLibrary, removeFromLibrary } = useMealStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleDelete = async (mealId: string) => {
    setDeletingId(mealId);
    try {
      await removeFromLibrary(mealId);
      toast.success("Comida eliminada de la biblioteca");
    } catch (error: any) {
      console.error("Error deleting meal:", error);
      toast.error(error.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Desayuno":
        return <Coffee className="h-4 w-4" />;
      case "Media Mañana":
        return <Sun className="h-4 w-4" />;
      case "Comida":
        return <Utensils className="h-4 w-4" />;
      case "Merienda":
        return <Apple className="h-4 w-4" />;
      case "Cena":
        return <Moon className="h-4 w-4" />;
      default:
        return <Utensils className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Desayuno":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Media Mañana":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Comida":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Merienda":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Cena":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  // Group meals by category
  const mealsByCategory = meals.reduce((acc, meal) => {
    if (!acc[meal.category]) {
      acc[meal.category] = [];
    }
    acc[meal.category].push(meal);
    return acc;
  }, {} as Record<string, LibraryMeal[]>);

  const categories = ["Desayuno", "Media Mañana", "Comida", "Merienda", "Cena"];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (meals.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Library className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-2">
            Tu biblioteca de comidas está vacía
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Guarda tus comidas favoritas desde el historial para reutilizarlas fácilmente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            Mi biblioteca de comidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category) => {
            const categoryMeals = mealsByCategory[category] || [];
            if (categoryMeals.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getCategoryColor(category)}>
                    {getCategoryIcon(category)}
                    <span className="ml-1">{category}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {categoryMeals.length} {categoryMeals.length === 1 ? "comida" : "comidas"}
                  </span>
                </div>
                <div className="space-y-2">
                  {categoryMeals.map((meal) => (
                    <Card
                      key={meal.id}
                      className={`border-2 cursor-pointer transition-colors hover:border-primary/50 ${
                        onMealSelected ? "hover:bg-primary/5" : ""
                      }`}
                      onClick={() => onMealSelected?.(meal)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium mb-1">{meal.title}</div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {meal.description}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-primary font-medium">{meal.calories}</span>
                                <span className="text-muted-foreground">kcal</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-accent font-medium">{meal.protein}g</span>
                                <span className="text-muted-foreground">proteína</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-blue-400 font-medium">{meal.carbs}g</span>
                                <span className="text-muted-foreground">carbs</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400 font-medium">{meal.fats}g</span>
                                <span className="text-muted-foreground">grasas</span>
                              </div>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {deletingId === meal.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar comida?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará "{meal.title}" de tu biblioteca de comidas. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(meal.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Utensils, Clock, Sparkles, Loader2, Check, Library, Edit3, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AILimitReached } from "./AILimitReached";
import { mealService } from "../services/meal.service";
import { useAuthStore } from "../store/useAuthStore";
import { useMealStore } from "../store/useMealStore";
import { MealAnalysis, LibraryMeal } from "../types";

interface MealLoggerProps {
  onMealLogged?: () => void;
  // Props opcionales para límites de IA
  mealAnalysisUsed?: number;
  mealAnalysisLimit?: number;
  onUpgrade?: () => void;
  isPro?: boolean;
}

export function MealLogger({ onMealLogged, mealAnalysisUsed, mealAnalysisLimit, onUpgrade, isPro }: MealLoggerProps) {
  const { accessToken } = useAuthStore();
  const { 
    addMeal, 
    libraryMeals, 
    fetchLibrary, 
    isLoadingLibrary 
  } = useMealStore();
  
  // Function to determine meal category based on current time
  const getDefaultCategory = () => {
    const hour = new Date().getHours();
    
    if (hour >= 4 && hour < 10) {
      return "breakfast"; // 4AM - 10AM
    } else if (hour >= 10 && hour < 13) {
      return "mid-morning"; // 10AM - 1PM
    } else if (hour >= 13 && hour < 17) {
      return "lunch"; // 1PM - 5PM
    } else if (hour >= 17 && hour < 20) {
      return "snack"; // 5PM - 8PM
    } else {
      return "dinner"; // 8PM - 4AM
    }
  };

  const [mode, setMode] = useState<"new" | "library" | "manual">("new");
  const [mealText, setMealText] = useState("");
  const [category, setCategory] = useState(getDefaultCategory());
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [additionalNote, setAdditionalNote] = useState("");
  const [selectedLibraryMeal, setSelectedLibraryMeal] = useState<LibraryMeal | null>(null);
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  
  // Manual entry
  const [manualData, setManualData] = useState({
    title: "",
    description: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  useEffect(() => {
    if (mode === "library") {
      fetchLibrary();
    }
  }, [mode]);

  const analyzeMeal = async () => {
    if (!mealText.trim()) {
      toast.error("Describe tu comida primero");
      return;
    }

    // Verificar límite de IA
    if (mealAnalysisUsed && mealAnalysisLimit && mealAnalysisUsed >= mealAnalysisLimit && !isPro) {
      toast.error("Has alcanzado el límite de análisis de IA. Considera actualizar a un plan Pro.");
      onUpgrade?.();
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      await addMeal({
        mealText: additionalNote ? `${mealText}\n\nNota adicional: ${additionalNote}` : mealText,
        category,
        time,
      });

      toast.success("¡Comida analizada y guardada! 🎉");
      if (onMealLogged) onMealLogged();
      
      // Reset form
      setTimeout(() => {
        setMealText("");
        setAnalysis(null);
        setAdditionalNote("");
        setCategory(getDefaultCategory());
        setTime(new Date().toTimeString().slice(0, 5));
      }, 3000);
    } catch (error: any) {
      console.error("Error analyzing meal:", error);
      toast.error(error.message || "Error al conectar con el servidor");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveManualMeal = async () => {
    if (!manualData.title.trim() || !manualData.description.trim()) {
      toast.error("Completa título y descripción");
      return;
    }

    if (!manualData.calories || !manualData.protein || !manualData.carbs || !manualData.fats) {
      toast.error("Completa todos los valores nutricionales");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Save meal directly to history with manual data
      await addMeal({
        mealText: manualData.description || manualData.title,
        category,
        time,
        manualAnalysis: {
          calories: parseFloat(manualData.calories),
          protein: parseFloat(manualData.protein),
          carbs: parseFloat(manualData.carbs),
          fats: parseFloat(manualData.fats),
          feedback: "Valores ingresados manualmente",
        },
      });

      toast.success("¡Comida guardada! ✅");
      if (onMealLogged) onMealLogged();
      
      // Reset form
      setManualData({
        title: "",
        description: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
      });
      setCategory(getDefaultCategory());
      setTime(new Date().toTimeString().slice(0, 5));
    } catch (error: any) {
      console.error("Error saving manual meal:", error);
      toast.error(error.message || "Error al conectar");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectLibraryMeal = (meal: LibraryMeal) => {
    setSelectedLibraryMeal(meal);
    setShowLibraryDialog(false);
    
    // Pre-fill the form with library meal data
    setMealText(meal.description);
    setManualData({
      title: meal.title,
      description: meal.description,
      calories: meal.calories.toString(),
      protein: meal.protein.toString(),
      carbs: meal.carbs.toString(),
      fats: meal.fats.toString(),
    });
  };

  const saveLibraryMeal = async () => {
    if (!selectedLibraryMeal) return;

    setIsAnalyzing(true);

    try {
      const mealDescription = additionalNote 
        ? `${selectedLibraryMeal.description}\n\nCambios: ${additionalNote}`
        : selectedLibraryMeal.description;

      await addMeal({
        mealText: mealDescription,
        category,
        time,
        manualAnalysis: {
          calories: selectedLibraryMeal.calories,
          protein: selectedLibraryMeal.protein,
          carbs: selectedLibraryMeal.carbs,
          fats: selectedLibraryMeal.fats,
          feedback: additionalNote ? `Basado en: ${selectedLibraryMeal.title}. ${additionalNote}` : `Basado en: ${selectedLibraryMeal.title}`,
        },
      });

      toast.success("¡Comida guardada! ✅");
      if (onMealLogged) onMealLogged();
      
      // Reset
      setSelectedLibraryMeal(null);
      setAdditionalNote("");
      setCategory(getDefaultCategory());
      setTime(new Date().toTimeString().slice(0, 5));
    } catch (error: any) {
      console.error("Error saving library meal:", error);
      toast.error(error.message || "Error al conectar");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      breakfast: "Desayuno",
      "mid-morning": "Media Mañana",
      lunch: "Comida",
      snack: "Merienda",
      dinner: "Cena",
    };
    return labels[cat] || cat;
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Registrar comida
        </CardTitle>
        <CardDescription>
          Elige cómo registrar tu comida
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode selector */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new" className="text-xs sm:text-sm">
              <Sparkles className="h-4 w-4 mr-1" />
              Con IA
            </TabsTrigger>
            <TabsTrigger value="library" className="text-xs sm:text-sm">
              <Library className="h-4 w-4 mr-1" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs sm:text-sm">
              <Edit3 className="h-4 w-4 mr-1" />
              Manual
            </TabsTrigger>
          </TabsList>

          {/* Common fields */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="category">Tipo</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">🌅 Desayuno</SelectItem>
                  <SelectItem value="mid-morning">☕ Media mañana</SelectItem>
                  <SelectItem value="lunch">☀️ Comida</SelectItem>
                  <SelectItem value="snack">🍎 Merienda</SelectItem>
                  <SelectItem value="dinner">🌙 Cena</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-12 pl-11 pr-3 border-2 border-input rounded-lg bg-input text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* New meal with AI */}
          <TabsContent value="new" className="space-y-4 mt-4">
            {/* Mostrar límite alcanzado si es necesario */}
            {mealAnalysisUsed && mealAnalysisLimit && mealAnalysisUsed >= mealAnalysisLimit && !isPro ? (
              <AILimitReached
                type="meal"
                onUpgrade={() => onUpgrade?.()}
                onContinueWithoutAI={() => setMode("manual")}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mealText">Describe tu comida</Label>
                  <Textarea
                    id="mealText"
                    placeholder='Ej: "2 huevos revueltos, 2 tostadas integrales, 1 plátano"'
                    value={mealText}
                    onChange={(e) => setMealText(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>

                {analysis && (
                  <Alert className="bg-primary/10 border-primary/30">
                    <Check className="h-4 w-4 text-primary" />
                    <AlertDescription className="space-y-2">
                      <div className="font-medium text-primary">Análisis nutricional:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Calorías:</span>{" "}
                          <span className="font-medium">{analysis.calories} kcal</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Proteína:</span>{" "}
                          <span className="font-medium">{analysis.protein}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carbos:</span>{" "}
                          <span className="font-medium">{analysis.carbs}g</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Grasas:</span>{" "}
                          <span className="font-medium">{analysis.fats}g</span>
                        </div>
                      </div>
                      <p className="text-sm pt-2 border-t border-primary/20">
                        <span className="font-medium">Feedback:</span> {analysis.feedback}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={analyzeMeal}
                  className="w-full h-12"
                  disabled={isAnalyzing || !mealText.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analizando con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analizar y guardar con IA
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          {/* From library */}
          <TabsContent value="library" className="space-y-4 mt-4">
            {selectedLibraryMeal ? (
              <>
                <Alert className="bg-primary/10 border-primary/30">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <div className="font-medium mb-2">{selectedLibraryMeal.title}</div>
                    <p className="text-sm text-muted-foreground mb-3">{selectedLibraryMeal.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Calorías:</span>{" "}
                        <span className="font-medium">{selectedLibraryMeal.calories} kcal</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Proteína:</span>{" "}
                        <span className="font-medium">{selectedLibraryMeal.protein}g</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carbos:</span>{" "}
                        <span className="font-medium">{selectedLibraryMeal.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Grasas:</span>{" "}
                        <span className="font-medium">{selectedLibraryMeal.fats}g</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="additionalNote">Nota adicional (opcional)</Label>
                  <Textarea
                    id="additionalNote"
                    placeholder='Ej: "Le eché más aceite, comí una rebanada de pan extra"'
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Indica si hiciste algún cambio respecto a la comida original
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLibraryMeal(null)}
                    className="flex-1"
                  >
                    Cambiar comida
                  </Button>
                  <Button
                    onClick={saveLibraryMeal}
                    disabled={isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {isLoadingLibrary ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : libraryMeals.length === 0 ? (
                  <Alert>
                    <Library className="h-4 w-4" />
                    <AlertDescription>
                      Tu biblioteca está vacía. Guarda comidas desde el historial para reutilizarlas.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Selecciona una comida de tu biblioteca:
                    </p>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {libraryMeals
                        .filter((meal) => meal.category === getCategoryLabel(category))
                        .map((meal) => (
                          <Card
                            key={meal.id}
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => selectLibraryMeal(meal)}
                          >
                            <CardContent className="p-4">
                              <div className="font-medium mb-1">{meal.title}</div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                {meal.description}
                              </p>
                              <div className="flex gap-3 text-xs flex-wrap">
                                <span>{meal.calories} kcal</span>
                                <span>{meal.protein}g proteína</span>
                                <span>{meal.carbs}g carbos</span>
                                <span>{meal.fats}g grasas</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {libraryMeals.filter((meal) => meal.category === getCategoryLabel(category)).length === 0 && (
                        <Alert>
                          <AlertDescription>
                            No tienes comidas guardadas para {getCategoryLabel(category).toLowerCase()}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* Manual entry */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="manualTitle">Título de la comida</Label>
              <Input
                id="manualTitle"
                placeholder='Ej: "Desayuno proteico"'
                value={manualData.title}
                onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualDescription">Descripción</Label>
              <Textarea
                id="manualDescription"
                placeholder='Ej: "2 huevos revueltos con aguacate y 2 tostadas"'
                value={manualData.description}
                onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manualCalories">Calorías (kcal)</Label>
                <Input
                  id="manualCalories"
                  type="number"
                  step="1"
                  placeholder="500"
                  value={manualData.calories}
                  onChange={(e) => setManualData({ ...manualData, calories: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualProtein">Proteína (g)</Label>
                <Input
                  id="manualProtein"
                  type="number"
                  step="0.1"
                  placeholder="30"
                  value={manualData.protein}
                  onChange={(e) => setManualData({ ...manualData, protein: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualCarbs">Carbohidratos (g)</Label>
                <Input
                  id="manualCarbs"
                  type="number"
                  step="0.1"
                  placeholder="50"
                  value={manualData.carbs}
                  onChange={(e) => setManualData({ ...manualData, carbs: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualFats">Grasas (g)</Label>
                <Input
                  id="manualFats"
                  type="number"
                  step="0.1"
                  placeholder="15"
                  value={manualData.fats}
                  onChange={(e) => setManualData({ ...manualData, fats: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            <Button
              onClick={saveManualMeal}
              className="w-full h-12"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Guardar comida
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
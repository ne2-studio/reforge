import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { ChefHat, Sparkles, RefreshCcw, Loader2, Dumbbell, Armchair, ChevronDown, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { mealService } from "../services/meal.service";
import { useAuthStore } from "../store/useAuthStore";
import { useMealStore } from "../store/useMealStore";
import { useUserStore } from "../store/useUserStore";
import { DailyMenu as DailyMenuData, MealSuggestion } from "../types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface DailyMenuProps {
}

export function DailyMenu({ }: DailyMenuProps) {
  const { accessToken } = useAuthStore();
  const { profile: userProfile } = useUserStore();
  const { dailyMenu: menuData, isLoadingMenu: isLoading, fetchDailyMenu, generateDailyMenu: generateMenuStore } = useMealStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTrainingType, setSelectedTrainingType] = useState<boolean | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tempTrainingType, setTempTrainingType] = useState<boolean | null>(null);
  const [openMeals, setOpenMeals] = useState<Record<number, boolean>>({});

  // Helper function to check if today is a training day based on profile
  const getTodayIsTrainingDay = (): boolean => {
    if (!userProfile?.trainingDays || userProfile.trainingDays.length === 0) {
      return false; // Default to rest day if not configured
    }

    const daysMap: Record<number, string> = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday"
    };

    const todayDayOfWeek = new Date().getDay();
    const todayKey = daysMap[todayDayOfWeek];
    
    return userProfile.trainingDays.includes(todayKey);
  };

  const autoDetectedTrainingDay = getTodayIsTrainingDay();
  const effectiveTrainingDay = selectedTrainingType !== null ? selectedTrainingType : autoDetectedTrainingDay;

  useEffect(() => {
    fetchDailyMenu();
  }, []);

  const generateMenu = async () => {
    setIsGenerating(true);
    try {
      await generateMenuStore(true, selectedTrainingType !== null ? selectedTrainingType : undefined);
      setSelectedTrainingType(null); // Reset selection after generating
      toast.success("¡Menú generado! 🍽️");
    } catch (error: any) {
      console.error("Exception generating menu:", error);
      toast.error(error.message || "Error al conectar");
    } finally {
      setIsGenerating(false);
    }
  };

  const isTodaysMenu = menuData?.date === new Date().toISOString().split('T')[0];

  return (
    <Card className="border-2 border-accent/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-accent" />
              Menú del día
              {menuData?.isTrainingDay !== undefined && isTodaysMenu && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  menuData.isTrainingDay 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {menuData.isTrainingDay ? '🏋️ Entreno' : '🛋️ Descanso'}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Tu plan nutricional personalizado
            </CardDescription>
          </div>
          <Button 
            onClick={generateMenu} 
            disabled={isGenerating || isLoading}
            variant="outline"
            size="sm"
            className="h-10"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isTodaysMenu ? 'Regenerar' : 'Generar'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : menuData && isTodaysMenu ? (
          <div className="space-y-4">
            {/* Show current day type with edit button */}
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Menú generado para:
                </span>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  selectedTrainingType !== null 
                    ? (selectedTrainingType ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-foreground border border-border')
                    : (menuData.isTrainingDay ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-foreground border border-border')
                }`}>
                  {selectedTrainingType !== null 
                    ? (selectedTrainingType ? '🏋️ Día de entreno' : '🛋️ Día de descanso')
                    : (menuData.isTrainingDay ? '🏋️ Día de entreno' : '🛋️ Día de descanso')
                  }
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTempTrainingType(selectedTrainingType !== null ? selectedTrainingType : menuData.isTrainingDay);
                  setIsEditDialogOpen(true);
                }}
                className="text-xs h-8 gap-1"
              >
                <Edit2 className="h-3 w-3" />
                Editar
              </Button>
            </div>

            {menuData.totalCalories && (
              <Alert className="bg-primary/10 border-primary/30">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm text-white">
                  <strong>Objetivo de hoy:</strong> {menuData.totalCalories}
                  {menuData.macros && ` · ${menuData.macros}`}
                </AlertDescription>
              </Alert>
            )}

            {menuData.suggestions.map((suggestion, index) => (
              <Collapsible 
                key={index}
                open={openMeals[index] ?? false}
                onOpenChange={(isOpen) => setOpenMeals(prev => ({ ...prev, [index]: isOpen }))}
              >
                <div className="border-2 border-border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{suggestion.emoji}</span>
                        <h4>{suggestion.meal}</h4>
                      </div>
                      <ChevronDown 
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                          openMeals[index] ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                      {suggestion.options.map((option, optionIndex) => (
                        <div 
                          key={optionIndex} 
                          className="text-sm pl-4 py-1 text-foreground/90"
                        >
                          • {option}
                        </div>
                      ))}

                      {suggestion.tips && (
                        <p className="text-xs text-muted-foreground italic pl-4 pt-2">
                          💡 {suggestion.tips}
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show auto-detected training day with edit button */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Tipo de día detectado:
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    selectedTrainingType !== null 
                      ? (selectedTrainingType ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-foreground border border-border')
                      : (autoDetectedTrainingDay ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted text-foreground border border-border')
                  }`}>
                    {selectedTrainingType !== null 
                      ? (selectedTrainingType ? '🏋️ Día de entreno' : '🛋️ Día de descanso')
                      : (autoDetectedTrainingDay ? '🏋️ Día de entreno' : '🛋️ Día de descanso')
                    }
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempTrainingType(selectedTrainingType !== null ? selectedTrainingType : autoDetectedTrainingDay);
                    setIsEditDialogOpen(true);
                  }}
                  className="text-xs h-8 gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </Button>
              </div>
            </div>

            <Alert className="bg-accent/10 border-accent/30">
              <Sparkles className="h-4 w-4 text-accent" />
              <AlertDescription className="text-sm">
                Genera tu menú personalizado basado en tus objetivos
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Placeholder menu structure */}
              <div className="border-2 border-border rounded-lg p-4 opacity-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌅</span>
                  <h4>Desayuno</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  El coach generará sugerencias basadas en tus objetivos y preferencias
                </p>
              </div>

              <div className="border-2 border-border rounded-lg p-4 opacity-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">☀️</span>
                  <h4>Comida</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Opciones balanceadas para mantenerte en track
                </p>
              </div>

              <div className="border-2 border-border rounded-lg p-4 opacity-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌙</span>
                  <h4>Cena</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Comida ligera y nutritiva para cerrar el día
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dialog for editing day type - shared by both states */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cambiar tipo de día</DialogTitle>
              <DialogDescription>
                Selecciona si hoy es día de entreno o descanso. {isTodaysMenu ? 'Luego regenera' : 'Luego genera'} el menú para aplicar los cambios.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 py-4">
              <Button
                variant={tempTrainingType === true ? "default" : "outline"}
                onClick={() => setTempTrainingType(true)}
                className="flex-1 h-20 flex-col gap-2"
              >
                <Dumbbell className="h-6 w-6" />
                <span>Día de entreno</span>
              </Button>
              <Button
                variant={tempTrainingType === false ? "default" : "outline"}
                onClick={() => setTempTrainingType(false)}
                className="flex-1 h-20 flex-col gap-2"
              >
                <Armchair className="h-6 w-6" />
                <span>Día de descanso</span>
              </Button>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setTempTrainingType(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setSelectedTrainingType(tempTrainingType);
                  setIsEditDialogOpen(false);
                  toast.success(`Tipo de día actualizado. Haz clic en '${isTodaysMenu ? 'Regenerar' : 'Generar'}' para aplicar los cambios.`);
                }}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
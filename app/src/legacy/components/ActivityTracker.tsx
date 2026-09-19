import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Dumbbell, Heart, Footprints, Plus, Loader2, Calendar, Flame } from "lucide-react";
import { toast } from "sonner";
import { useActivityStore } from "../store/useActivityStore";
import { Activity } from "../types";

interface ActivityTrackerProps {
}

export function ActivityTracker({ }: ActivityTrackerProps) {
  const { activities, isLoadingActivities: isLoading, fetchActivities, logActivity } = useActivityStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activityType, setActivityType] = useState<"strength" | "cardio" | "neat">("strength");
  const [newActivity, setNewActivity] = useState({
    duration: "",
    steps: "",
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSave = async () => {
    if ((activityType === "strength" || activityType === "cardio") && !newActivity.duration) {
      toast.error("Ingresa la duración");
      return;
    }
    if (activityType === "neat" && !newActivity.steps) {
      toast.error("Ingresa el número de pasos");
      return;
    }

    setIsSaving(true);
    try {
      const activity: Omit<Activity, "id"> = {
        type: activityType,
        timestamp: new Date().toISOString(),
      };

      if (activityType === "neat") {
        activity.steps = parseInt(newActivity.steps);
      } else {
        activity.duration = parseInt(newActivity.duration);
      }

      await logActivity(activity);
      
      toast.success("¡Actividad registrada! 💪");
      setNewActivity({ duration: "", steps: "" });
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error saving activity:", error);
      toast.error(error.message || "Error al conectar");
    } finally {
      setIsSaving(false);
    }
  };

  // Calcular calorías estimadas según tipo de actividad
  const calculateCalories = (activity: Activity): number => {
    if (activity.type === "strength") {
      // ~6 kcal por minuto para entreno de fuerza
      return Math.round((activity.duration || 0) * 6);
    } else if (activity.type === "cardio") {
      // ~8 kcal por minuto para cardio
      return Math.round((activity.duration || 0) * 8);
    } else {
      // ~0.04 kcal por paso
      return Math.round((activity.steps || 0) * 0.04);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <Dumbbell className="h-5 w-5 text-primary" />;
      case "cardio":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "neat":
        return <Footprints className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "strength":
        return "Entreno de fuerza";
      case "cardio":
        return "Sesión de cardio";
      case "neat":
        return "NEAT";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary">Actividad</h2>
          <p className="text-sm text-muted-foreground">Registra tus entrenos, cardio y pasos</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 gap-2">
              <Plus className="h-5 w-5" />
              Registrar actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar actividad</DialogTitle>
              <DialogDescription>Selecciona el tipo de actividad</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label>Tipo de actividad</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={activityType === "strength" ? "default" : "outline"}
                    className="h-24 flex-col gap-2"
                    onClick={() => setActivityType("strength")}
                  >
                    <Dumbbell className="h-6 w-6" />
                    <span className="text-xs">Fuerza</span>
                  </Button>
                  <Button
                    type="button"
                    variant={activityType === "cardio" ? "default" : "outline"}
                    className="h-24 flex-col gap-2"
                    onClick={() => setActivityType("cardio")}
                  >
                    <Heart className="h-6 w-6" />
                    <span className="text-xs">Cardio</span>
                  </Button>
                  <Button
                    type="button"
                    variant={activityType === "neat" ? "default" : "outline"}
                    className="h-24 flex-col gap-2"
                    onClick={() => setActivityType("neat")}
                  >
                    <Footprints className="h-6 w-6" />
                    <span className="text-xs">NEAT</span>
                  </Button>
                </div>
              </div>

              {(activityType === "strength" || activityType === "cardio") && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="1"
                    value={newActivity.duration}
                    onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                    placeholder="Ej: 45"
                    className="h-12"
                  />
                </div>
              )}

              {activityType === "neat" && (
                <div className="space-y-2">
                  <Label htmlFor="steps">Número de pasos</Label>
                  <Input
                    id="steps"
                    type="number"
                    step="1"
                    value={newActivity.steps}
                    onChange={(e) => setNewActivity({ ...newActivity, steps: e.target.value })}
                    placeholder="Ej: 8000"
                    className="h-12"
                  />
                </div>
              )}

              <Button onClick={handleSave} disabled={isSaving} className="w-full h-12">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar actividad"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Historial de actividades */}
      {activities.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Historial de actividades</h3>
            </div>
            <div className="space-y-3">
              {activities
                .slice()
                .reverse()
                .map((activity, index) => {
                  const calories = calculateCalories(activity);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getActivityIcon(activity.type)}
                        <div>
                          <div className="font-medium">
                            {getActivityLabel(activity.type)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-orange-500 font-medium">
                          <Flame className="h-4 w-4" />
                          {calories} kcal
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.type === "neat"
                            ? `${activity.steps?.toLocaleString()} pasos`
                            : `${activity.duration} min`}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Aún no has registrado ninguna actividad
            </p>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Registrar primera actividad
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

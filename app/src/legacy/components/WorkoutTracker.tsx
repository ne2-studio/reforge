import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Dumbbell, Clock, Plus, Loader2, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useActivityStore } from "../store/useActivityStore";
import { Workout } from "../types";

interface WorkoutTrackerProps {
}

export function WorkoutTracker({ }: WorkoutTrackerProps) {
  const { workouts, isLoadingWorkouts: isLoading, fetchWorkouts, logWorkout } = useActivityStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutType, setWorkoutType] = useState<"strength" | "cardio">("strength");
  const [newWorkout, setNewWorkout] = useState({
    volume: "",
    duration: "",
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleSave = async () => {
    if (workoutType === "strength" && !newWorkout.volume) {
      toast.error("Ingresa el volumen levantado");
      return;
    }
    if (workoutType === "cardio" && !newWorkout.duration) {
      toast.error("Ingresa la duración");
      return;
    }

    setIsSaving(true);
    try {
      const workout: Omit<Workout, "id"> = {
        type: workoutType,
        timestamp: new Date().toISOString(),
      };

      if (workoutType === "strength") {
        workout.volume = parseFloat(newWorkout.volume);
      } else {
        workout.duration = parseFloat(newWorkout.duration);
      }

      await logWorkout(workout);
      
      toast.success("¡Entreno registrado! 💪");
      setNewWorkout({ volume: "", duration: "" });
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error saving workout:", error);
      toast.error(error.message || "Error al conectar");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Stats
  const strengthWorkouts = workouts.filter((w) => w.type === "strength");
  const cardioWorkouts = workouts.filter((w) => w.type === "cardio");
  const totalVolume = strengthWorkouts.reduce((sum, w) => sum + (w.volume || 0), 0);
  const totalCardioMinutes = cardioWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

  // Chart data
  const volumeChartData = strengthWorkouts
    .slice(-10)
    .map((w) => ({
      date: new Date(w.timestamp).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      volume: w.volume || 0,
    }));

  const cardioChartData = cardioWorkouts
    .slice(-10)
    .map((w) => ({
      date: new Date(w.timestamp).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      duration: w.duration || 0,
    }));

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary">Entrenamientos</h2>
          <p className="text-sm text-muted-foreground">Registra tus sesiones de fuerza y cardio</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 gap-2">
              <Plus className="h-5 w-5" />
              Nuevo entreno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar entreno</DialogTitle>
              <DialogDescription>Ingresa los detalles de tu entreno</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label>Tipo de entreno</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={workoutType === "strength" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setWorkoutType("strength")}
                  >
                    <Dumbbell className="h-6 w-6" />
                    <span>Fuerza</span>
                  </Button>
                  <Button
                    type="button"
                    variant={workoutType === "cardio" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setWorkoutType("cardio")}
                  >
                    <Clock className="h-6 w-6" />
                    <span>Cardio</span>
                  </Button>
                </div>
              </div>

              {workoutType === "strength" && (
                <div className="space-y-2">
                  <Label htmlFor="volume">Volumen total levantado (kg)</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.1"
                    value={newWorkout.volume}
                    onChange={(e) => setNewWorkout({ ...newWorkout, volume: e.target.value })}
                    placeholder="Ej: 2500"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Suma de todas las series × reps × peso
                  </p>
                </div>
              )}

              {workoutType === "cardio" && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="1"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                    placeholder="Ej: 45"
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
                  "Guardar entreno"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4 text-primary" />
              Fuerza
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-primary">{strengthWorkouts.length}</div>
            <div className="text-xs text-muted-foreground">sesiones</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-accent" />
              Volumen total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-accent">{totalVolume.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">kg levantados</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" />
              Cardio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-primary">{cardioWorkouts.length}</div>
            <div className="text-xs text-muted-foreground">sesiones</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-accent" />
              Tiempo total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-accent">{totalCardioMinutes}</div>
            <div className="text-xs text-muted-foreground">minutos</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {volumeChartData.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Volumen de fuerza
            </CardTitle>
            <CardDescription>Kg levantados por sesión</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={volumeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis 
                  dataKey="date" 
                  stroke="#a3a3a3"
                  tick={{ fontSize: 12, fill: "#a3a3a3" }}
                />
                <YAxis 
                  stroke="#a3a3a3" 
                  tick={{ fontSize: 12, fill: "#a3a3a3" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "2px solid #84cc16",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#84cc16"
                  strokeWidth={3}
                  dot={{ fill: "#84cc16", r: 4 }}
                  name="Volumen (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {cardioChartData.length > 0 && (
        <Card className="border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Duración de cardio
            </CardTitle>
            <CardDescription>Minutos por sesión</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cardioChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis 
                  dataKey="date" 
                  stroke="#a3a3a3"
                  tick={{ fontSize: 12, fill: "#a3a3a3" }}
                />
                <YAxis 
                  stroke="#a3a3a3" 
                  tick={{ fontSize: 12, fill: "#a3a3a3" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "2px solid #22d3ee",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ fill: "#22d3ee", r: 4 }}
                  name="Duración (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent workouts */}
      {workouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workouts
                .slice()
                .reverse()
                .slice(0, 10)
                .map((workout, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {workout.type === "strength" ? (
                        <Dumbbell className="h-5 w-5 text-primary" />
                      ) : (
                        <Clock className="h-5 w-5 text-accent" />
                      )}
                      <div>
                        <div className="font-medium">
                          {workout.type === "strength" ? "Fuerza" : "Cardio"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(workout.timestamp).toLocaleDateString("es-ES", {
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
                      {workout.type === "strength" ? (
                        <>
                          <div className="text-primary font-medium">
                            {workout.volume?.toLocaleString()} kg
                          </div>
                          <div className="text-xs text-muted-foreground">volumen</div>
                        </>
                      ) : (
                        <>
                          <div className="text-accent font-medium">{workout.duration} min</div>
                          <div className="text-xs text-muted-foreground">duración</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {workouts.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Aún no has registrado ningún entreno
            </p>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Registrar primer entreno
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
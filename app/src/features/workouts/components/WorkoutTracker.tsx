import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/design-system/components/ui/dialog';
import { Label } from '@/design-system/components/ui/label';
import { Input } from '@/design-system/components/ui/input';
import { Dumbbell, Clock, Plus, Loader2, Calendar, TrendingUp } from 'lucide-react';
import type { LogWorkoutData, Workout } from '@/types';

type WorkoutType = 'strength' | 'cardio';

interface WorkoutTrackerProps {
  workouts: Workout[];
  isLoading: boolean;
  isSaving: boolean;
  onLog: (data: LogWorkoutData) => void;
}

// Presentational — no react-router-dom/store/useCases imports. Ported from
// reforge-frontend/src/components/WorkoutTracker.tsx: a dialog to pick a workout type
// (strength/cardio) then log its type-specific field, stat cards, two line charts (volume over
// the last 10 strength sessions, cardio duration over the last 10 cardio sessions), and a
// recent-history list. Uses raw recharts (as the source does), since this repo's ChartContainer
// wrapper adds theming/legend machinery this simple two-series case doesn't need.
export function WorkoutTracker({ workouts, isLoading, isSaving, onLog }: WorkoutTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [volume, setVolume] = useState('');
  const [duration, setDuration] = useState('');

  const isValid = workoutType === 'strength' ? volume.trim() !== '' : duration.trim() !== '';

  const handleSave = () => {
    if (!isValid) return;

    onLog({
      type: workoutType,
      volume: workoutType === 'strength' ? parseFloat(volume) : null,
      duration: workoutType === 'cardio' ? parseFloat(duration) : null,
    });
    setVolume('');
    setDuration('');
    setIsOpen(false);
  };

  const strengthWorkouts = workouts.filter((w) => w.type === 'strength');
  const cardioWorkouts = workouts.filter((w) => w.type === 'cardio');
  const totalVolume = strengthWorkouts.reduce((sum, w) => sum + (w.volume ?? 0), 0);
  const totalCardioMinutes = cardioWorkouts.reduce((sum, w) => sum + (w.duration ?? 0), 0);

  // History is already most-recent-first (mirrors GET /api/workouts's ordering); the last 10
  // sessions chronologically are its first 10 entries, then reversed so the chart reads
  // oldest-to-newest left to right.
  const volumeChartData = strengthWorkouts
    .slice(0, 10)
    .slice()
    .reverse()
    .map((w) => ({
      date: w.timestamp.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      volume: w.volume ?? 0,
    }));

  const cardioChartData = cardioWorkouts
    .slice(0, 10)
    .slice()
    .reverse()
    .map((w) => ({
      date: w.timestamp.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      duration: w.duration ?? 0,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entrenamientos</h1>
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
                    variant={workoutType === 'strength' ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    onClick={() => setWorkoutType('strength')}
                  >
                    <Dumbbell className="h-6 w-6" />
                    <span>Fuerza</span>
                  </Button>
                  <Button
                    type="button"
                    variant={workoutType === 'cardio' ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    onClick={() => setWorkoutType('cardio')}
                  >
                    <Clock className="h-6 w-6" />
                    <span>Cardio</span>
                  </Button>
                </div>
              </div>

              {workoutType === 'strength' && (
                <div className="space-y-2">
                  <Label htmlFor="volume">Volumen total levantado (kg)</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="Ej: 2500"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">Suma de todas las series × reps × peso</p>
                </div>
              )}

              {workoutType === 'cardio' && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ej: 45"
                    className="h-12"
                  />
                </div>
              )}

              <Button onClick={handleSave} disabled={isSaving || !isValid} className="w-full h-12">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar entreno'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && workouts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="volume" stroke="#84cc16" strokeWidth={3} name="Volumen (kg)" />
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="duration" stroke="#22d3ee" strokeWidth={3} name="Duración (min)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {workouts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Historial reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workouts.slice(0, 10).map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {workout.type === 'strength' ? (
                          <Dumbbell className="h-5 w-5 text-primary" />
                        ) : (
                          <Clock className="h-5 w-5 text-accent" />
                        )}
                        <div>
                          <div className="font-medium">{workout.type === 'strength' ? 'Fuerza' : 'Cardio'}</div>
                          <div className="text-sm text-muted-foreground">
                            {workout.timestamp.toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {workout.type === 'strength' ? (
                          <>
                            <div className="text-primary font-medium">{workout.volume?.toLocaleString()} kg</div>
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
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">Aún no has registrado ningún entreno</p>
                <Button onClick={() => setIsOpen(true)} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Registrar primer entreno
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/design-system/components/ui/button';
import { Card, CardContent } from '@/design-system/components/ui/card';
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
import { Dumbbell, Heart, Footprints, Plus, Loader2, Calendar, Flame } from 'lucide-react';
import type { Activity, LogActivityData } from '@/types';
import { estimateCalories } from '../calorieEstimate';

type ActivityType = 'strength' | 'cardio' | 'neat';

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  strength: 'Entreno de fuerza',
  cardio: 'Sesión de cardio',
  neat: 'NEAT',
};

function activityIcon(type: string) {
  if (type === 'strength') return <Dumbbell className="h-5 w-5 text-primary" />;
  if (type === 'cardio') return <Heart className="h-5 w-5 text-red-500" />;
  return <Footprints className="h-5 w-5 text-blue-500" />;
}

interface ActivityTrackerProps {
  activities: Activity[];
  isLoading: boolean;
  isSaving: boolean;
  onLog: (data: LogActivityData) => void;
}

// Presentational — no react-router-dom/store/useCases imports. Ported from
// reforge-frontend/src/components/ActivityTracker.tsx: a dialog to pick an activity type
// (strength/cardio/neat) then log its type-specific field, plus a history list showing a
// client-side calorie estimate (never sent to/received from the backend, see
// calorieEstimate.ts). Follows this repo's own Dialog/Card design-system components instead of
// the source's raw ones.
export function ActivityTracker({ activities, isLoading, isSaving, onLog }: ActivityTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('strength');
  const [duration, setDuration] = useState('');
  const [steps, setSteps] = useState('');

  const isValid =
    activityType === 'neat' ? steps.trim() !== '' : duration.trim() !== '';

  const handleSave = () => {
    if (!isValid) return;

    onLog({
      type: activityType,
      duration: activityType === 'neat' ? null : parseInt(duration, 10),
      steps: activityType === 'neat' ? parseInt(steps, 10) : null,
    });
    setDuration('');
    setSteps('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Actividad</h1>
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
                    variant={activityType === 'strength' ? 'default' : 'outline'}
                    className="h-24 flex-col gap-2"
                    onClick={() => setActivityType('strength')}
                  >
                    <Dumbbell className="h-6 w-6" />
                    <span className="text-xs">Fuerza</span>
                  </Button>
                  <Button
                    type="button"
                    variant={activityType === 'cardio' ? 'default' : 'outline'}
                    className="h-24 flex-col gap-2"
                    onClick={() => setActivityType('cardio')}
                  >
                    <Heart className="h-6 w-6" />
                    <span className="text-xs">Cardio</span>
                  </Button>
                  <Button
                    type="button"
                    variant={activityType === 'neat' ? 'default' : 'outline'}
                    className="h-24 flex-col gap-2"
                    onClick={() => setActivityType('neat')}
                  >
                    <Footprints className="h-6 w-6" />
                    <span className="text-xs">NEAT</span>
                  </Button>
                </div>
              </div>

              {activityType !== 'neat' && (
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

              {activityType === 'neat' && (
                <div className="space-y-2">
                  <Label htmlFor="steps">Número de pasos</Label>
                  <Input
                    id="steps"
                    type="number"
                    step="1"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    placeholder="Ej: 8000"
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
                  'Guardar actividad'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && activities.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activities.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Historial de actividades</h3>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => {
                const calories = estimateCalories(activity);
                return (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {activityIcon(activity.type)}
                      <div>
                        <div className="font-medium">
                          {ACTIVITY_LABELS[activity.type as ActivityType] ?? activity.type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.timestamp.toLocaleDateString('es-ES', {
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
                      <div className="flex items-center gap-1 text-orange-500 font-medium justify-end">
                        <Flame className="h-4 w-4" />
                        {calories} kcal
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.type === 'neat' ? `${activity.steps?.toLocaleString()} pasos` : `${activity.duration} min`}
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
            <p className="text-muted-foreground text-center mb-4">Aún no has registrado ninguna actividad</p>
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

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useWorkoutStore } from '@/store/workoutStore';
import { loadWorkouts, logWorkout } from '../useCases';
import { WorkoutTracker } from '../components/WorkoutTracker';
import type { LogWorkoutData } from '@/types';

// Container for /entrenamientos. Loads the caller's workouts through the workout store on
// mount — see docs/architecture/frontend.md's `routes/` layer.
export function WorkoutRoute() {
  const { workouts, isLoading, error } = useWorkoutStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadWorkouts();
  }, []);

  const handleLog = async (data: LogWorkoutData) => {
    setIsSaving(true);
    try {
      await logWorkout(data);
      toast.success('¡Entreno registrado! 💪');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar el entreno');
    } finally {
      setIsSaving(false);
    }
  };

  if (error && workouts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <button className="underline" onClick={() => void loadWorkouts()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <WorkoutTracker workouts={workouts} isLoading={isLoading} isSaving={isSaving} onLog={handleLog} />
      </div>
    </div>
  );
}

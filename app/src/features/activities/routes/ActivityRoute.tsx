import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useActivityStore } from '@/store/activityStore';
import { loadActivities, logActivity } from '../useCases';
import { ActivityTracker } from '../components/ActivityTracker';
import type { LogActivityData } from '@/types';

// Container for /actividad. Loads the caller's activities through the activity store on
// mount — see docs/architecture/frontend.md's `routes/` layer.
export function ActivityRoute() {
  const { activities, isLoading, error } = useActivityStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadActivities();
  }, []);

  const handleLog = async (data: LogActivityData) => {
    setIsSaving(true);
    try {
      await logActivity(data);
      toast.success('¡Actividad registrada! 💪');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar la actividad');
    } finally {
      setIsSaving(false);
    }
  };

  if (error && activities.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <button className="underline" onClick={() => void loadActivities()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <ActivityTracker activities={activities} isLoading={isLoading} isSaving={isSaving} onLog={handleLog} />
      </div>
    </div>
  );
}

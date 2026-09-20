import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMeasurementStore } from '@/store/measurementStore';
import { useProfileStore } from '@/store/profileStore';
import { useWeeklyProgressStore } from '@/store/weeklyProgressStore';
import { loadMeasurements, loadWeeklyProgress, logMeasurement } from '../useCases';
import { loadProfile } from '@/features/profile/useCases';
import { ProgressTracker } from '../components/ProgressTracker';
import { WeeklyProgress } from '../components/WeeklyProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/components/ui/tabs';
import type { LogMeasurementData } from '@/types';

// Container for /progreso. Loads the caller's measurements through the measurement store on
// mount, and also (read-only) the profile store, since the body-fat/lean-mass estimate needs
// the caller's height/gender — see docs/architecture/frontend.md's `routes/` layer. Loading the
// profile here is safe even if another route already loaded it: profileStore is shared, and
// loadProfile() is idempotent (a plain GET, no side effects). Also loads weekly progress for
// the "Resumen semanal" tab — the old standalone /historial route was folded into this screen
// as a second tab alongside "Medidas y evolución".
export function ProgressRoute() {
  const { measurements, isLoading, error } = useMeasurementStore();
  const { profile } = useProfileStore();
  const { weeklyProgress, isLoading: isLoadingWeeklyProgress } = useWeeklyProgressStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadMeasurements();
    void loadProfile();
    void loadWeeklyProgress();
  }, []);

  const handleLog = async (data: LogMeasurementData) => {
    setIsSaving(true);
    try {
      await logMeasurement(data);
      toast.success('¡Medida guardada! 💪');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar la medida');
    } finally {
      setIsSaving(false);
    }
  };

  if (error && measurements.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <button className="underline" onClick={() => void loadMeasurements()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Tabs defaultValue="medidas">
          <TabsList>
            <TabsTrigger value="medidas">Medidas y evolución</TabsTrigger>
            <TabsTrigger value="semanal">Resumen semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="medidas" className="space-y-6">
            <ProgressTracker
              measurements={measurements}
              profile={profile}
              isLoading={isLoading}
              isSaving={isSaving}
              onLog={handleLog}
            />
          </TabsContent>

          <TabsContent value="semanal" className="space-y-6">
            <WeeklyProgress weeklyProgress={weeklyProgress} isLoading={isLoadingWeeklyProgress} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMeasurementStore } from "@/store/measurementStore";
import { useProfileStore } from "@/store/profileStore";
import { loadMeasurements, logMeasurement } from "../useCases";
import { loadProfile } from "@/features/profile/useCases";
import { ProgressTracker } from "../components/ProgressTracker";
import type { LogMeasurementData } from "@/types";

// Container for /progreso/medidas. Loads the caller's measurements through the measurement
// store on mount, and also (read-only) the profile store, since the body-fat/lean-mass estimate
// needs the caller's height/gender — see docs/architecture/frontend.md's `routes/` layer.
// Loading the profile here is safe even if another route already loaded it: profileStore is
// shared, and loadProfile() is idempotent (a plain GET, no side effects).
export function MeasurementsRoute() {
  const { measurements, isLoading, error } = useMeasurementStore();
  const { profile } = useProfileStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadMeasurements();
    void loadProfile();
  }, []);

  const handleLog = async (data: LogMeasurementData) => {
    setIsSaving(true);
    try {
      await logMeasurement(data);
      toast.success("¡Medida guardada! 💪");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al guardar la medida",
      );
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
        <ProgressTracker
          measurements={measurements}
          profile={profile}
          isLoading={isLoading}
          isSaving={isSaving}
          onLog={handleLog}
        />
      </div>
    </div>
  );
}

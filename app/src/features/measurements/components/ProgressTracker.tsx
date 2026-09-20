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
import { Loader2, Plus, Ruler, Scale, Target, TrendingDown } from 'lucide-react';
import { computeBodyComposition } from '../bodyComposition';
import type { LogMeasurementData, Measurement, UserProfile } from '@/types';

const GOAL_LABELS: Record<string, string> = {
  'lose-fat': '🔥 Perder grasa',
  'gain-muscle': '💪 Ganar músculo',
  recomp: '⚡ Recomposición',
  maintain: '🎯 Mantener',
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentario',
  light: 'Actividad ligera',
  moderate: 'Actividad moderada',
  active: 'Muy activo',
  very_active: 'Extremadamente activo',
};

interface ProgressTrackerProps {
  measurements: Measurement[];
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  onLog: (data: LogMeasurementData) => void;
}

// Presentational — no react-router-dom/store/useCases imports. Ported from
// reforge-frontend/src/components/ProgressTracker.tsx: a dialog to log weight/waist/neck, stat
// cards (goal, latest weight/waist/neck, and a client-side-only body-fat/lean-mass estimate),
// four line charts (weight, waist, body fat %, lean mass), and a recent-history empty state.
// Uses raw recharts (as WorkoutTracker.tsx does), since this repo's ChartContainer wrapper adds
// theming/legend machinery this simple single-series case doesn't need. GET /api/measurements
// is already most-recent-first, so chart data is reversed to read oldest-to-newest left to
// right.
export function ProgressTracker({ measurements, profile, isLoading, isSaving, onLog }: ProgressTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');

  const isValid = weight.trim() !== '' || waist.trim() !== '' || neck.trim() !== '';

  const handleSave = () => {
    if (!isValid) return;

    onLog({
      weight: weight.trim() !== '' ? parseFloat(weight) : null,
      waist: waist.trim() !== '' ? parseFloat(waist) : null,
      neck: neck.trim() !== '' ? parseFloat(neck) : null,
    });
    setWeight('');
    setWaist('');
    setNeck('');
    setIsOpen(false);
  };

  const formatDate = (date: Date) => date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

  const weightData = measurements
    .filter((m) => m.weight !== null)
    .map((m) => ({ date: formatDate(m.timestamp), weight: m.weight }))
    .reverse();

  const waistData = measurements
    .filter((m) => m.waist !== null)
    .map((m) => ({ date: formatDate(m.timestamp), waist: m.waist }))
    .reverse();

  const bodyFatSeries = measurements
    .map((m) => ({ date: formatDate(m.timestamp), composition: computeBodyComposition(profile, m) }))
    .filter((entry): entry is { date: string; composition: NonNullable<typeof entry.composition> } => entry.composition !== null)
    .reverse();

  const bodyFatData = bodyFatSeries.map((entry) => ({
    date: entry.date,
    bodyFat: parseFloat(entry.composition.bodyFatPercentage.toFixed(1)),
  }));

  const leanMassData = bodyFatSeries.map((entry) => ({
    date: entry.date,
    leanMass: parseFloat(entry.composition.leanMass.toFixed(1)),
  }));

  const latestMeasurement = measurements[0];
  const latestComposition = computeBodyComposition(profile, latestMeasurement);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tu progreso</h1>
          <p className="text-sm text-muted-foreground">Registra tus medidas y sigue tu evolución</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 gap-2">
              <Plus className="h-5 w-5" />
              Nueva medida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar medidas</DialogTitle>
              <DialogDescription>Ingresa tus medidas actuales</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-weight">Peso (kg)</Label>
                <Input
                  id="new-weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-waist">Cintura (cm)</Label>
                <Input
                  id="new-waist"
                  type="number"
                  step="0.1"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-neck">Cuello (cm)</Label>
                <Input
                  id="new-neck"
                  type="number"
                  step="0.1"
                  value={neck}
                  onChange={(e) => setNeck(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button onClick={handleSave} disabled={isSaving || !isValid} className="w-full h-12">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && measurements.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {latestMeasurement && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {profile?.goal && (
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-primary" />
                      Objetivo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-primary">{GOAL_LABELS[profile.goal] ?? profile.goal}</div>
                    {profile.activityLevel && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {latestMeasurement.weight !== null && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Scale className="h-4 w-4 text-primary" />
                      Peso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-primary">{latestMeasurement.weight} kg</div>
                  </CardContent>
                </Card>
              )}

              {latestMeasurement.waist !== null && (
                <Card className="border-2 border-accent/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Ruler className="h-4 w-4 text-accent" />
                      Cintura
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-accent">{latestMeasurement.waist} cm</div>
                  </CardContent>
                </Card>
              )}

              {latestMeasurement.neck !== null && (
                <Card className="border-2 border-accent/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Ruler className="h-4 w-4 text-accent" />
                      Cuello
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-accent">{latestMeasurement.neck} cm</div>
                  </CardContent>
                </Card>
              )}

              {latestComposition && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-primary" />
                      Grasa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-primary">{latestComposition.bodyFatPercentage.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{latestComposition.fatMass.toFixed(1)} kg</div>
                  </CardContent>
                </Card>
              )}

              {latestComposition && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Scale className="h-4 w-4 text-primary" />
                      Músculo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-primary">{latestComposition.leanMass.toFixed(1)} kg</div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {weightData.length > 0 && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Peso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#84cc16" strokeWidth={3} name="Peso (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {waistData.length > 0 && (
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-accent" />
                  Cintura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={waistData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="waist" stroke="#22d3ee" strokeWidth={3} name="Cintura (cm)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {bodyFatData.length > 0 && (
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-accent" />
                  Grasa corporal (%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={bodyFatData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bodyFat" stroke="#22d3ee" strokeWidth={3} name="Grasa (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {leanMassData.length > 0 && (
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-accent" />
                  Masa muscular (kg)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={leanMassData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="leanMass" stroke="#22d3ee" strokeWidth={3} name="Músculo (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {measurements.length === 0 && (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Aún no tienes medidas
                  <br />
                  ¡Empieza a trackear tu progreso! 💪
                </p>
                <Button onClick={() => setIsOpen(true)} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Registrar primera medida
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

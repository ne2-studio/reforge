import { TrendingDown, Plus, Scale, Ruler, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { useUserStore } from "../store/useUserStore";
import { Measurement } from "../types";

interface ProgressTrackerProps {
}

// US Navy Body Fat Formula
export const calculateBodyFat = (
  gender: string,
  height: number,
  waist: number,
  neck: number
): number => {
  if (gender === 'male') {
    // For men: % BF = 495 / (1.0324 - 0.19077 × log10(waist - neck) + 0.15456 × log10(height)) - 450
    const logWaistMinusNeck = Math.log10(waist - neck);
    const logHeight = Math.log10(height);
    const denominator = 1.0324 - 0.19077 * logWaistMinusNeck + 0.15456 * logHeight;
    return 495 / denominator - 450;
  } else {
    // For women (without hip): Using simplified formula
    // % BF = 163.205 × log10(waist - neck) - 97.684 × log10(height) - 78.387
    const logWaistMinusNeck = Math.log10(waist - neck);
    const logHeight = Math.log10(height);
    return 163.205 * logWaistMinusNeck - 97.684 * logHeight - 78.387;
  }
};

export function ProgressTracker({ }: ProgressTrackerProps) {
  const { profile, measurements, addMeasurement } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    weight: "",
    waist: "",
    neck: "",
  });

  const saveMeasurement = async () => {
    const measurement: Omit<Measurement, "id"> = {
      timestamp: new Date().toISOString(),
    };

    if (newMeasurement.weight) measurement.weight = parseFloat(newMeasurement.weight);
    if (newMeasurement.waist) measurement.waist = parseFloat(newMeasurement.waist);
    if (newMeasurement.neck) measurement.neck = parseFloat(newMeasurement.neck);

    if (Object.keys(measurement).length === 1) {
      toast.error("Ingresa al menos una medida");
      return;
    }

    try {
      await addMeasurement(measurement);
      toast.success("¡Medida guardada! 💪");
      setNewMeasurement({ weight: "", waist: "", neck: "" });
      setIsOpen(false);
    } catch (error: any) {
      console.error("Exception saving measurement:", error);
      toast.error(error.message || "Error al conectar");
    }
  };

  const weightData = measurements
    .filter((m) => m.weight)
    .map((m) => ({
      date: new Date(m.timestamp).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      weight: m.weight,
    }));

  const waistData = measurements
    .filter((m) => m.waist)
    .map((m) => ({
      date: new Date(m.timestamp).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      waist: m.waist,
    }));

  const latestMeasurement = measurements[measurements.length - 1];

  // Calculate body composition if we have the necessary data
  let bodyFatPercentage: number | null = null;
  let leanMass: number | null = null;
  let fatMass: number | null = null;

  if (profile && latestMeasurement) {
    const height = parseFloat(profile.height);
    const weight = latestMeasurement.weight;
    const waist = latestMeasurement.waist;
    const neck = latestMeasurement.neck;

    if (height && weight && waist && neck && waist > neck) {
      bodyFatPercentage = calculateBodyFat(profile.gender, height, waist, neck);
      fatMass = (weight * bodyFatPercentage) / 100;
      leanMass = weight - fatMass;
    }
  }

  // Body fat chart data
  const bodyFatData = measurements
    .filter((m) => {
      if (!profile || !m.weight || !m.waist || !m.neck) return false;
      const height = parseFloat(profile.height);
      return height && m.waist && m.neck && m.waist > m.neck;
    })
    .map((m) => {
      const height = parseFloat(profile.height);
      const bf = calculateBodyFat(profile.gender, height, m.waist!, m.neck!);
      return {
        date: new Date(m.timestamp).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        }),
        bodyFat: parseFloat(bf.toFixed(1)),
      };
    });

  const leanMassData = measurements
    .filter((m) => {
      if (!profile || !m.weight || !m.waist || !m.neck) return false;
      const height = parseFloat(profile.height);
      return height && m.waist && m.neck && m.waist > m.neck;
    })
    .map((m) => {
      const height = parseFloat(profile.height);
      const bf = calculateBodyFat(profile.gender, height, m.waist!, m.neck!);
      const lean = m.weight! - (m.weight! * bf) / 100;
      return {
        date: new Date(m.timestamp).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        }),
        leanMass: parseFloat(lean.toFixed(1)),
      };
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-primary">Tu progreso</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-12">
              <Plus className="mr-2 h-5 w-5" />
              Nueva medida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar medidas</DialogTitle>
              <DialogDescription>
                Ingresa tus medidas actuales
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-weight">Peso (kg)</Label>
                <Input
                  id="new-weight"
                  type="number"
                  step="0.1"
                  value={newMeasurement.weight}
                  onChange={(e) =>
                    setNewMeasurement({ ...newMeasurement, weight: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-waist">Cintura (cm)</Label>
                <Input
                  id="new-waist"
                  type="number"
                  step="0.1"
                  value={newMeasurement.waist}
                  onChange={(e) =>
                    setNewMeasurement({ ...newMeasurement, waist: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-neck">Cuello (cm)</Label>
                <Input
                  id="new-neck"
                  type="number"
                  step="0.1"
                  value={newMeasurement.neck}
                  onChange={(e) =>
                    setNewMeasurement({ ...newMeasurement, neck: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              <Button onClick={saveMeasurement} className="w-full h-12">
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {latestMeasurement && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* Goal Card - Always first */}
          {profile?.goal && (
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-primary" />
                  Objetivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-primary">
                  {profile.goal === 'lose-fat' && '🔥 Perder grasa'}
                  {profile.goal === 'gain-muscle' && '💪 Ganar músculo'}
                  {profile.goal === 'recomp' && '⚡ Recomposición'}
                  {profile.goal === 'maintain' && '🎯 Mantener'}
                </div>
                {profile.activity && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {profile.activity === 'sedentary' && 'Sedentario'}
                    {profile.activity === 'light' && 'Actividad ligera'}
                    {profile.activity === 'moderate' && 'Actividad moderada'}
                    {profile.activity === 'active' && 'Muy activo'}
                    {profile.activity === 'very_active' && 'Extremadamente activo'}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {latestMeasurement.weight && (
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
          {latestMeasurement.waist && (
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
          {latestMeasurement.neck && (
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
          {bodyFatPercentage !== null && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  Grasa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-primary">{bodyFatPercentage.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{fatMass!.toFixed(1)} kg</div>
              </CardContent>
            </Card>
          )}
          {leanMass !== null && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Scale className="h-4 w-4 text-primary" />
                  Músculo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-primary">{leanMass.toFixed(1)} kg</div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#a3a3a3" />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "2px solid #84cc16",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#84cc16"
                  strokeWidth={3}
                  dot={{ fill: "#84cc16", r: 4 }}
                />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#a3a3a3" />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "2px solid #22d3ee",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="waist"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ fill: "#22d3ee", r: 4 }}
                />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#a3a3a3" />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "2px solid #22d3ee",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bodyFat"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ fill: "#22d3ee", r: 4 }}
                />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#a3a3a3" />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "2px solid #22d3ee",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="leanMass"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ fill: "#22d3ee", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {measurements.length === 0 && (
        <Card className="border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingDown className="h-20 w-20 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              Aún no tienes medidas
              <br />
              ¡Empieza a trackear tu progreso! 💪
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
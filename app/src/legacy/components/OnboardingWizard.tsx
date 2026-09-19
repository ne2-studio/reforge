import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserStore } from "../store/useUserStore";
import { UserProfile, Measurement } from "../types";

interface OnboardingData extends UserProfile {
  trainingType: string;
  trainingTime: string;
}

interface OnboardingWizardProps {
}

export function OnboardingWizard({ }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { updateProfile, addMeasurement } = useUserStore();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    age: "",
    gender: "",
    weight: "",
    height: "",
    waist: "",
    neck: "",
    goal: "",
    goalBodyFat: "",
    caloricPreference: "",
    restrictions: "",
    trainingDays: [],
    trainingType: "",
    trainingTime: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const updateData = (field: keyof OnboardingData, value: string | string[]) => {
    setData({ ...data, [field]: value });
  };

  const toggleTrainingDay = (day: string) => {
    const currentDays = data.trainingDays || [];
    if (currentDays.includes(day)) {
      updateData("trainingDays", currentDays.filter(d => d !== day));
    } else {
      updateData("trainingDays", [...currentDays, day]);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await updateProfile(data);

      // Save initial measurements from onboarding
      const initialMeasurement: any = {
        timestamp: new Date().toISOString(),
      };
      if (data.weight) initialMeasurement.weight = parseFloat(data.weight);
      if (data.waist) initialMeasurement.waist = parseFloat(data.waist);
      if (data.neck) initialMeasurement.neck = parseFloat(data.neck);

      // Only save if we have at least one measurement
      if (Object.keys(initialMeasurement).length > 1) {
        try {
          await addMeasurement(initialMeasurement);
        } catch (mError) {
          console.error("Failed to save initial measurement:", mError);
        }
      }

      toast.success("¡Perfil completado! 🎉");
      navigate("/");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Error al conectar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary text-primary-foreground rounded-2xl p-3 shadow-lg shadow-primary/50">
              <Zap className="h-6 w-6" />
            </div>
          </div>
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          <CardTitle className="text-center">Configuración de perfil</CardTitle>
          <CardDescription className="text-center">
            Paso {step} de {totalSteps}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Información básica</h3>
                <p className="text-muted-foreground">Empecemos con lo esencial</p>
              </div>
              <div className="grid gap-6">
                <div className="space-y-3">
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="30"
                    value={data.age}
                    onChange={(e) => updateData("age", e.target.value)}
                    className="h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Sexo</Label>
                  <RadioGroup value={data.gender} onValueChange={(v) => updateData("gender", v)} className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="flex-1 cursor-pointer">Hombre</Label>
                    </div>
                    <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="flex-1 cursor-pointer">Mujer</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Medidas actuales</h3>
                <p className="text-muted-foreground">Tu punto de partida</p>
              </div>
              <div className="grid gap-6">
                <div className="space-y-3">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="75.0"
                    value={data.weight}
                    onChange={(e) => updateData("weight", e.target.value)}
                    className="h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={data.height}
                    onChange={(e) => updateData("height", e.target.value)}
                    className="h-14 text-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Medidas opcionales</h3>
                <p className="text-muted-foreground">
                  Para un seguimiento más preciso
                </p>
              </div>
              <div className="grid gap-4">
                <div className="space-y-3">
                  <Label htmlFor="waist">Cintura (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    placeholder="80.0"
                    value={data.waist}
                    onChange={(e) => updateData("waist", e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="neck">Cuello (cm)</Label>
                  <Input
                    id="neck"
                    type="number"
                    step="0.1"
                    placeholder="35.0"
                    value={data.neck}
                    onChange={(e) => updateData("neck", e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Tu objetivo</h3>
                <p className="text-muted-foreground">¿Qué quieres conseguir?</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="goal">Meta principal</Label>
                  <Select value={data.goal} onValueChange={(v) => updateData("goal", v)}>
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder="Selecciona tu objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose-fat">🔥 Perder grasa</SelectItem>
                      <SelectItem value="gain-muscle">💪 Ganar músculo</SelectItem>
                      <SelectItem value="recomp">⚡ Recomposición</SelectItem>
                      <SelectItem value="maintain">🎯 Mantener</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="goalBodyFat">% grasa corporal objetivo (opcional)</Label>
                  <Input
                    id="goalBodyFat"
                    type="number"
                    step="0.1"
                    placeholder="12.0"
                    value={data.goalBodyFat}
                    onChange={(e) => updateData("goalBodyFat", e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="caloricPreference">Enfoque calórico</Label>
                  <Select
                    value={data.caloricPreference}
                    onValueChange={(v) => updateData("caloricPreference", v)}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder="Selecciona tu enfoque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aggressive-deficit">Déficit agresivo (-500 kcal)</SelectItem>
                      <SelectItem value="moderate-deficit">Déficit moderado (-300 kcal)</SelectItem>
                      <SelectItem value="slight-deficit">Déficit leve (-200 kcal)</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      <SelectItem value="slight-surplus">Superávit leve (+200 kcal)</SelectItem>
                      <SelectItem value="moderate-surplus">Superávit moderado (+300 kcal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Restricciones</h3>
                <p className="text-muted-foreground">
                  Personaliza tu experiencia
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="restrictions">
                  Alergias, intolerancias o preferencias
                </Label>
                <Textarea
                  id="restrictions"
                  placeholder='Ej: "Sin lactosa, no me gusta el aguacate"'
                  value={data.restrictions}
                  onChange={(e) => updateData("restrictions", e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
                <p className="text-center">
                  🚀 ¡Listo! Vamos a crear tu plan personalizado
                </p>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Entrenamiento</h3>
                <p className="text-muted-foreground">
                  Configura tu rutina para menús adaptativos
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Días de entrenamiento</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'monday', label: 'Lunes' },
                      { value: 'tuesday', label: 'Martes' },
                      { value: 'wednesday', label: 'Miércoles' },
                      { value: 'thursday', label: 'Jueves' },
                      { value: 'friday', label: 'Viernes' },
                      { value: 'saturday', label: 'Sábado' },
                      { value: 'sunday', label: 'Domingo' },
                    ].map((day) => (
                      <div key={day.value} className="flex items-center space-x-2 border-2 border-border rounded-lg p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                        <Checkbox
                          id={day.value}
                          checked={data.trainingDays.includes(day.value)}
                          onCheckedChange={() => toggleTrainingDay(day.value)}
                        />
                        <Label htmlFor={day.value} className="flex-1 cursor-pointer">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="trainingType">Tipo de entrenamiento</Label>
                  <Select
                    value={data.trainingType}
                    onValueChange={(v) => updateData("trainingType", v)}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder="Selecciona tu tipo de entrenamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">💪 Fuerza / Pesas</SelectItem>
                      <SelectItem value="cardio">🏃 Cardio</SelectItem>
                      <SelectItem value="mixed">⚡ Mixto (Fuerza + Cardio)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="trainingTime">Horario habitual de entreno</Label>
                  <Select
                    value={data.trainingTime}
                    onValueChange={(v) => updateData("trainingTime", v)}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder="Selecciona tu horario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">🌅 Mañana (6:00 - 12:00)</SelectItem>
                      <SelectItem value="afternoon">☀️ Tarde (12:00 - 18:00)</SelectItem>
                      <SelectItem value="evening">🌙 Noche (18:00 - 22:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
                <p className="text-sm text-center">
                  💡 Usaremos esta info para generar menús adaptativos: más hidratos en días de entreno, más grasas en descanso
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              className="flex-1 h-12"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Atrás
            </Button>
            {step < totalSteps ? (
              <Button onClick={nextStep} className="flex-1 h-12">
                Siguiente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="flex-1 h-12" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Completar 🎉"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
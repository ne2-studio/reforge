import { useState } from 'react';
import { Button } from '@/design-system/components/ui/button';
import { Input } from '@/design-system/components/ui/input';
import { Label } from '@/design-system/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/design-system/components/ui/radio-group';
import { Textarea } from '@/design-system/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import { Progress } from '@/design-system/components/ui/progress';
import { Checkbox } from '@/design-system/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import type { SaveProfileData } from '@/types';

export interface OnboardingFormData {
  age: string;
  gender: string;
  weight: string;
  height: string;
  goal: string;
  restrictions: string;
  trainingDays: string[];
  trainingType: string;
  trainingTime: string;
}

const EMPTY_FORM_DATA: OnboardingFormData = {
  age: '',
  gender: '',
  weight: '',
  height: '',
  goal: '',
  restrictions: '',
  trainingDays: [],
  trainingType: '',
  trainingTime: '',
};

// Maps the wizard's plain-string form state onto the wire shape POST /profile expects —
// empty strings become null rather than being sent as "".
export function toSaveProfileData(data: OnboardingFormData): SaveProfileData {
  return {
    age: data.age ? parseInt(data.age, 10) : null,
    gender: data.gender || null,
    height: data.height ? parseFloat(data.height) : null,
    weight: data.weight ? parseFloat(data.weight) : null,
    // Not captured by this wizard (no UI decision made for it in this slice) — always sent
    // as null; a later slice can add a step for it without changing the wire contract.
    activityLevel: null,
    goal: data.goal || null,
    trainingDays: data.trainingDays.length > 0 ? data.trainingDays : null,
    trainingType: data.trainingType || null,
    trainingTime: data.trainingTime || null,
    restrictions: data.restrictions || null,
    calorieTarget: null,
    extraData: null,
  };
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

interface OnboardingWizardProps {
  isSaving: boolean;
  onComplete: (data: SaveProfileData) => void;
}

// Presentational — no react-router-dom/store/useCases imports. First-time setup wizard for
// the user's profile. Ported from legacy/components/OnboardingWizard.tsx, with waist/neck
// (Slice 5 — Measurements) and goalBodyFat/caloricPreference (Slice 8 — AI coach) dropped:
// they don't map to any field on the new backend's ProfileDto. Dropping the "medidas
// opcionales" step took totalSteps from 6 to 5.
export function OnboardingWizard({ isSaving, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingFormData>(EMPTY_FORM_DATA);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const updateData = (field: keyof OnboardingFormData, value: string | string[]) => {
    setData({ ...data, [field]: value });
  };

  const toggleTrainingDay = (day: string) => {
    const currentDays = data.trainingDays;
    updateData(
      'trainingDays',
      currentDays.includes(day) ? currentDays.filter((d) => d !== day) : [...currentDays, day]
    );
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(toSaveProfileData(data));
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
                    onChange={(e) => updateData('age', e.target.value)}
                    className="h-14 text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Sexo</Label>
                  <RadioGroup
                    value={data.gender}
                    onValueChange={(v) => updateData('gender', v)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="flex-1 cursor-pointer">
                        Hombre
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border-2 border-border rounded-lg p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="flex-1 cursor-pointer">
                        Mujer
                      </Label>
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
                    onChange={(e) => updateData('weight', e.target.value)}
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
                    onChange={(e) => updateData('height', e.target.value)}
                    className="h-14 text-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Tu objetivo</h3>
                <p className="text-muted-foreground">¿Qué quieres conseguir?</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="goal">Meta principal</Label>
                  <Select value={data.goal} onValueChange={(v) => updateData('goal', v)}>
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
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Restricciones</h3>
                <p className="text-muted-foreground">Personaliza tu experiencia</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="restrictions">Alergias, intolerancias o preferencias</Label>
                <Textarea
                  id="restrictions"
                  placeholder='Ej: "Sin lactosa, no me gusta el aguacate"'
                  value={data.restrictions}
                  onChange={(e) => updateData('restrictions', e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
                <p className="text-center">🚀 ¡Listo! Vamos a crear tu plan personalizado</p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-primary mb-2">Entrenamiento</h3>
                <p className="text-muted-foreground">Configura tu rutina para menús adaptativos</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Días de entrenamiento</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.value}
                        className="flex items-center space-x-2 border-2 border-border rounded-lg p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                      >
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
                  <Select value={data.trainingType} onValueChange={(v) => updateData('trainingType', v)}>
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
                  <Select value={data.trainingTime} onValueChange={(v) => updateData('trainingTime', v)}>
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
                  💡 Usaremos esta info para generar menús adaptativos: más hidratos en días de entreno, más grasas
                  en descanso
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={prevStep} disabled={step === 1} className="flex-1 h-12">
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
                {isSaving ? 'Guardando...' : 'Completar 🎉'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

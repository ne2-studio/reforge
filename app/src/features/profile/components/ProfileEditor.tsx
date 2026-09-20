import { useState } from 'react';
import { Button } from '@/design-system/components/ui/button';
import { Input } from '@/design-system/components/ui/input';
import { Label } from '@/design-system/components/ui/label';
import { Textarea } from '@/design-system/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import { User, Save, Loader2, Dumbbell } from 'lucide-react';
import { ReminderSettingsCard } from './ReminderSettingsCard';
import type {
  CustomReminder,
  ReminderSettings,
  SaveCustomReminderData,
  SaveProfileData,
  SaveReminderSettingsData,
  UserProfile,
} from '@/types';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'L', fullLabel: 'Lunes' },
  { key: 'tuesday', label: 'M', fullLabel: 'Martes' },
  { key: 'wednesday', label: 'X', fullLabel: 'Miércoles' },
  { key: 'thursday', label: 'J', fullLabel: 'Jueves' },
  { key: 'friday', label: 'V', fullLabel: 'Viernes' },
  { key: 'saturday', label: 'S', fullLabel: 'Sábado' },
  { key: 'sunday', label: 'D', fullLabel: 'Domingo' },
];

const GOAL_LABELS: Record<string, string> = {
  'lose-fat': 'Perder grasa',
  'gain-muscle': 'Ganar músculo',
  recomp: 'Recomposición',
  maintain: 'Mantener',
};

interface EditableFields {
  age: string;
  weight: string;
  height: string;
  restrictions: string;
  trainingDays: string[];
}

function toEditableFields(profile: UserProfile): EditableFields {
  return {
    age: profile.age?.toString() ?? '',
    weight: profile.weight?.toString() ?? '',
    height: profile.height?.toString() ?? '',
    restrictions: profile.restrictions ?? '',
    trainingDays: profile.trainingDays,
  };
}

// Merges edited fields back over the original profile — POST /profile is a full replace, so
// fields this editor doesn't expose (activityLevel, goal, trainingType, trainingTime,
// calorieTarget, extraData) must be carried over unchanged rather than dropped.
function toSaveProfileData(profile: UserProfile, edited: EditableFields): SaveProfileData {
  return {
    age: edited.age ? parseInt(edited.age, 10) : null,
    gender: profile.gender,
    height: edited.height ? parseFloat(edited.height) : null,
    weight: edited.weight ? parseFloat(edited.weight) : null,
    activityLevel: profile.activityLevel,
    goal: profile.goal,
    trainingDays: edited.trainingDays.length > 0 ? edited.trainingDays : null,
    trainingType: profile.trainingType,
    trainingTime: profile.trainingTime,
    restrictions: edited.restrictions || null,
    calorieTarget: profile.calorieTarget,
    extraData: profile.extraData,
  };
}

interface ProfileEditorProps {
  profile: UserProfile;
  isSaving: boolean;
  onSave: (data: SaveProfileData) => void;
  reminderSettings: ReminderSettings | null;
  customReminders: CustomReminder[];
  isLoadingReminders: boolean;
  isSavingReminderSettings: boolean;
  onSaveReminderSettings: (data: SaveReminderSettingsData) => void;
  onCreateReminder: (data: SaveCustomReminderData) => void;
  onUpdateReminder: (id: string, data: SaveCustomReminderData) => void;
  onDeleteReminder: (id: string) => void;
}

// Presentational — no react-router-dom/store/useCases imports. Read/edit view for an
// already-saved profile. Ported from legacy/components/ProfileEditor.tsx, with
// waist/neck/goalBodyFat/caloricPreference dropped (see OnboardingWizard's comment) and the
// History tab dropped entirely: that's Slice 7 (History), not built yet at the time, and the
// legacy component's Tabs/DayHistory imports were unused dead wiring anyway.
//
// Slice 6 (docs/plan/02-vertical-slices.md) adds a Recordatorios section below the profile
// card via <ReminderSettingsCard/> — there's no standalone reminders route, so it lives here,
// with reminders' own props forwarded straight through from ProfileRoute (the store/useCases
// wiring belongs there, not in this presentational component).
export function ProfileEditor({
  profile,
  isSaving,
  onSave,
  reminderSettings,
  customReminders,
  isLoadingReminders,
  isSavingReminderSettings,
  onSaveReminderSettings,
  onCreateReminder,
  onUpdateReminder,
  onDeleteReminder,
}: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<EditableFields>(() => toEditableFields(profile));

  const updateField = (field: keyof Omit<EditableFields, 'trainingDays'>, value: string) => {
    setEdited({ ...edited, [field]: value });
  };

  const toggleTrainingDay = (day: string) => {
    const currentDays = edited.trainingDays;
    setEdited({
      ...edited,
      trainingDays: currentDays.includes(day) ? currentDays.filter((d) => d !== day) : [...currentDays, day],
    });
  };

  const handleSave = () => {
    onSave(toSaveProfileData(profile, edited));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEdited(toEditableFields(profile));
    setIsEditing(false);
  };

  const reminders = (
    <ReminderSettingsCard
      settings={reminderSettings}
      customReminders={customReminders}
      isLoading={isLoadingReminders}
      isSavingSettings={isSavingReminderSettings}
      onSaveSettings={onSaveReminderSettings}
      onCreateReminder={onCreateReminder}
      onUpdateReminder={onUpdateReminder}
      onDeleteReminder={onDeleteReminder}
    />
  );

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Tu perfil
                </CardTitle>
                <CardDescription>Información personal y objetivos</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEdited(toEditableFields(profile));
                  setIsEditing(true);
                }}
                variant="outline"
              >
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-primary mb-3">Datos básicos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Edad</div>
                  <div>{profile.age != null ? `${profile.age} años` : 'No configurado'}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Sexo</div>
                  <div>{profile.gender === 'male' ? 'Hombre' : profile.gender === 'female' ? 'Mujer' : 'No configurado'}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Peso</div>
                  <div>{profile.weight != null ? `${profile.weight} kg` : 'No configurado'}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Altura</div>
                  <div>{profile.height != null ? `${profile.height} cm` : 'No configurado'}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-primary mb-3">Objetivos</h4>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Meta principal</div>
                <div>{profile.goal ? (GOAL_LABELS[profile.goal] ?? profile.goal) : 'No configurado'}</div>
              </div>
            </div>

            {profile.restrictions && (
              <div>
                <h4 className="text-primary mb-3">Restricciones alimentarias</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm">{profile.restrictions}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-primary mb-3 flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Días de entrenamiento
              </h4>
              <div className="bg-muted/30 rounded-lg p-3">
                {profile.trainingDays.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(
                      (day) =>
                        profile.trainingDays.includes(day.key) && (
                          <span key={day.key} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                            {day.fullLabel}
                          </span>
                        )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No configurado</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {reminders}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Editar perfil
          </CardTitle>
          <CardDescription>Actualiza tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-primary">Datos básicos</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-age">Edad</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={edited.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weight">Peso (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.1"
                  value={edited.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-height">Altura (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  value={edited.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-primary">Restricciones alimentarias</h4>
            <div className="space-y-2">
              <Label htmlFor="edit-restrictions">Alergias, intolerancias o preferencias</Label>
              <Textarea
                id="edit-restrictions"
                value={edited.restrictions}
                onChange={(e) => updateField('restrictions', e.target.value)}
                rows={4}
                className="resize-none"
                placeholder='Ej: "Sin lactosa, no me gusta el aguacate"'
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-primary flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Días de entrenamiento
            </h4>
            <div className="space-y-2">
              <Label>Selecciona los días que sueles entrenar</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = edited.trainingDays.includes(day.key);
                  return (
                    <Button
                      key={day.key}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTrainingDay(day.key)}
                      className="h-12"
                    >
                      {day.label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                El sistema usará esta configuración para generar menús automáticamente
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCancel} variant="outline" className="flex-1 h-12">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-12">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {reminders}
    </div>
  );
}

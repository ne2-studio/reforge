import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Save, Loader2, Dumbbell, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { DayHistory } from "./DayHistory";
import { useUserStore } from "../store/useUserStore";
import { UserProfile } from "../types";

interface ProfileEditorProps {
  onProfileUpdated?: () => void;
}

export function ProfileEditor({ onProfileUpdated }: ProfileEditorProps) {
  const { profile, updateProfile } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(profile);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  const handleSave = async () => {
    if (!editedProfile) return;
    setIsSaving(true);
    try {
      await updateProfile(editedProfile);
      if (onProfileUpdated) onProfileUpdated();
      setIsEditing(false);
      toast.success("¡Perfil actualizado! ✓");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Error al conectar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  if (!profile || !editedProfile) return null;

  const updateField = (field: keyof UserProfile, value: string) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const toggleTrainingDay = (day: string) => {
    const currentDays = editedProfile.trainingDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setEditedProfile({ ...editedProfile, trainingDays: newDays });
  };

  const daysOfWeek = [
    { key: "monday", label: "L", fullLabel: "Lunes" },
    { key: "tuesday", label: "M", fullLabel: "Martes" },
    { key: "wednesday", label: "X", fullLabel: "Miércoles" },
    { key: "thursday", label: "J", fullLabel: "Jueves" },
    { key: "friday", label: "V", fullLabel: "Viernes" },
    { key: "saturday", label: "S", fullLabel: "Sábado" },
    { key: "sunday", label: "D", fullLabel: "Domingo" },
  ];

  const goalLabels: Record<string, string> = {
    "lose-fat": "Perder grasa",
    "gain-muscle": "Ganar músculo",
    "recomp": "Recomposición",
    "maintain": "Mantener",
  };

  if (!isEditing) {
    return (
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
            <Button onClick={() => setIsEditing(true)} variant="outline">
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
                <div>{profile.age} años</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Sexo</div>
                <div>{profile.gender === "male" ? "Hombre" : "Mujer"}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Peso inicial</div>
                <div>{profile.weight} kg</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Altura</div>
                <div>{profile.height} cm</div>
              </div>
            </div>
          </div>

          {(profile.waist || profile.neck) && (
            <div>
              <h4 className="text-primary mb-3">Medidas iniciales</h4>
              <div className="grid grid-cols-2 gap-4">
                {profile.waist && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Cintura</div>
                    <div>{profile.waist} cm</div>
                  </div>
                )}
                {profile.neck && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Cuello</div>
                    <div>{profile.neck} cm</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-primary mb-3">Objetivos</h4>
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Meta principal</div>
                <div>{goalLabels[profile.goal] || profile.goal}</div>
              </div>
              {profile.goalBodyFat && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">% grasa objetivo</div>
                  <div>{profile.goalBodyFat}%</div>
                </div>
              )}
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
              {profile.trainingDays && profile.trainingDays.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    profile.trainingDays?.includes(day.key) && (
                      <span key={day.key} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                        {day.fullLabel}
                      </span>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No configurado</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
                value={editedProfile.age}
                onChange={(e) => updateField("age", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-weight">Peso inicial (kg)</Label>
              <Input
                id="edit-weight"
                type="number"
                step="0.1"
                value={editedProfile.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-height">Altura (cm)</Label>
              <Input
                id="edit-height"
                type="number"
                value={editedProfile.height}
                onChange={(e) => updateField("height", e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-primary">Medidas iniciales (opcional)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-waist">Cintura (cm)</Label>
              <Input
                id="edit-waist"
                type="number"
                step="0.1"
                value={editedProfile.waist}
                onChange={(e) => updateField("waist", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-neck">Cuello (cm)</Label>
              <Input
                id="edit-neck"
                type="number"
                step="0.1"
                value={editedProfile.neck}
                onChange={(e) => updateField("neck", e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-primary">Objetivos</h4>
          <div className="space-y-2">
            <Label htmlFor="edit-goal-bf">% grasa corporal objetivo (opcional)</Label>
            <Input
              id="edit-goal-bf"
              type="number"
              step="0.1"
              value={editedProfile.goalBodyFat}
              onChange={(e) => updateField("goalBodyFat", e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-primary">Restricciones alimentarias</h4>
          <div className="space-y-2">
            <Label htmlFor="edit-restrictions">Alergias, intolerancias o preferencias</Label>
            <Textarea
              id="edit-restrictions"
              value={editedProfile.restrictions}
              onChange={(e) => updateField("restrictions", e.target.value)}
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
              {daysOfWeek.map(day => {
                const isSelected = editedProfile.trainingDays?.includes(day.key);
                return (
                  <Button
                    key={day.key}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
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
  );
}
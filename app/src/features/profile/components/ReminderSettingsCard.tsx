import { useEffect, useState } from 'react';
import { Button } from '@/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/design-system/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/design-system/components/ui/alert-dialog';
import { Input } from '@/design-system/components/ui/input';
import { Label } from '@/design-system/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system/components/ui/select';
import { Switch } from '@/design-system/components/ui/switch';
import { Bell, Loader2, Plus, Trash2 } from 'lucide-react';
import type { CustomReminder, ReminderSettings, SaveCustomReminderData, SaveReminderSettingsData } from '@/types';

const CHANNEL_LABELS: Record<string, string> = {
  push: 'Notificación push',
  email: 'Correo electrónico',
};

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'L', fullLabel: 'Lunes' },
  { key: 'tuesday', label: 'M', fullLabel: 'Martes' },
  { key: 'wednesday', label: 'X', fullLabel: 'Miércoles' },
  { key: 'thursday', label: 'J', fullLabel: 'Jueves' },
  { key: 'friday', label: 'V', fullLabel: 'Viernes' },
  { key: 'saturday', label: 'S', fullLabel: 'Sábado' },
  { key: 'sunday', label: 'D', fullLabel: 'Domingo' },
];

const DEFAULT_SETTINGS: SaveReminderSettingsData = { enabled: false, channel: 'push', defaultTime: '08:00' };

interface EditableReminder {
  label: string;
  time: string;
  daysOfWeek: string[];
  enabled: boolean;
}

const EMPTY_REMINDER: EditableReminder = { label: '', time: '20:00', daysOfWeek: [], enabled: true };

function toEditableReminder(reminder: CustomReminder): EditableReminder {
  return { label: reminder.label, time: reminder.time, daysOfWeek: reminder.daysOfWeek, enabled: reminder.enabled };
}

interface ReminderSettingsCardProps {
  settings: ReminderSettings | null;
  customReminders: CustomReminder[];
  isLoading: boolean;
  isSavingSettings: boolean;
  onSaveSettings: (data: SaveReminderSettingsData) => void;
  onCreateReminder: (data: SaveCustomReminderData) => void;
  onUpdateReminder: (id: string, data: SaveCustomReminderData) => void;
  onDeleteReminder: (id: string) => void;
}

// Presentational — no react-router-dom/store/useCases imports. Rendered from ProfileEditor.tsx
// as the Recordatorios section of /perfil (Slice 6, see docs/plan/02-vertical-slices.md) — there
// is no standalone reminders route/screen. `settings: null` means the caller has never saved
// settings yet (a 404 from GET, mirroring UserProfile's own onboarding state), so the toggle
// starts from DEFAULT_SETTINGS until the first save.
export function ReminderSettingsCard({
  settings,
  customReminders,
  isLoading,
  isSavingSettings,
  onSaveSettings,
  onCreateReminder,
  onUpdateReminder,
  onDeleteReminder,
}: ReminderSettingsCardProps) {
  const [edited, setEdited] = useState<SaveReminderSettingsData>(
    settings
      ? { enabled: settings.enabled, channel: settings.channel, defaultTime: settings.defaultTime }
      : DEFAULT_SETTINGS
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [reminderForm, setReminderForm] = useState<EditableReminder>(EMPTY_REMINDER);

  // Syncs the editable form once loaded settings arrive — `settings` starts null while
  // isLoading is true (see ReminderSettingsCard's own doc comment), so the useState initializer
  // above only covers the case where settings were already loaded before this component mounted.
  useEffect(() => {
    if (settings) {
      setEdited({ enabled: settings.enabled, channel: settings.channel, defaultTime: settings.defaultTime });
    }
  }, [settings]);

  const handleSaveSettings = () => onSaveSettings(edited);

  const openNewReminderDialog = () => {
    setEditingReminderId(null);
    setReminderForm(EMPTY_REMINDER);
    setIsDialogOpen(true);
  };

  const openEditReminderDialog = (reminder: CustomReminder) => {
    setEditingReminderId(reminder.id);
    setReminderForm(toEditableReminder(reminder));
    setIsDialogOpen(true);
  };

  const toggleReminderDay = (day: string) => {
    setReminderForm((form) => ({
      ...form,
      daysOfWeek: form.daysOfWeek.includes(day) ? form.daysOfWeek.filter((d) => d !== day) : [...form.daysOfWeek, day],
    }));
  };

  const isReminderFormValid = reminderForm.label.trim() !== '' && reminderForm.time !== '' && reminderForm.daysOfWeek.length > 0;

  const handleSaveReminder = () => {
    if (!isReminderFormValid) return;

    const data: SaveCustomReminderData = {
      label: reminderForm.label.trim(),
      time: reminderForm.time,
      daysOfWeek: reminderForm.daysOfWeek,
      enabled: reminderForm.enabled,
    };

    if (editingReminderId) {
      onUpdateReminder(editingReminderId, data);
    } else {
      onCreateReminder(data);
    }
    setIsDialogOpen(false);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Recordatorios
        </CardTitle>
        <CardDescription>Configura cuándo quieres recibir avisos para registrar tu actividad</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reminders-enabled">Activar recordatorios</Label>
                  <p className="text-xs text-muted-foreground">Recibe avisos para no perder tu racha</p>
                </div>
                <Switch
                  id="reminders-enabled"
                  checked={edited.enabled}
                  onCheckedChange={(checked) => setEdited({ ...edited, enabled: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminders-channel">Canal</Label>
                  <Select value={edited.channel} onValueChange={(value) => setEdited({ ...edited, channel: value })}>
                    <SelectTrigger id="reminders-channel" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminders-default-time">Hora por defecto</Label>
                  <Input
                    id="reminders-default-time"
                    type="time"
                    value={edited.defaultTime}
                    onChange={(e) => setEdited({ ...edited, defaultTime: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full h-12">
                {isSavingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-primary">Recordatorios personalizados</h4>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" onClick={openNewReminderDialog}>
                      <Plus className="h-4 w-4" />
                      Nuevo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingReminderId ? 'Editar recordatorio' : 'Nuevo recordatorio'}</DialogTitle>
                      <DialogDescription>Elige cuándo quieres que te avisemos</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="reminder-label">Mensaje</Label>
                        <Input
                          id="reminder-label"
                          value={reminderForm.label}
                          onChange={(e) => setReminderForm({ ...reminderForm, label: e.target.value })}
                          placeholder="Ej: Registra tu cena"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reminder-time">Hora</Label>
                        <Input
                          id="reminder-time"
                          type="time"
                          value={reminderForm.time}
                          onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Días</Label>
                        <div className="grid grid-cols-7 gap-2">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = reminderForm.daysOfWeek.includes(day.key);
                            return (
                              <Button
                                key={day.key}
                                type="button"
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleReminderDay(day.key)}
                                className="h-12"
                                aria-label={day.fullLabel}
                              >
                                {day.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reminder-enabled">Activo</Label>
                        <Switch
                          id="reminder-enabled"
                          checked={reminderForm.enabled}
                          onCheckedChange={(checked) => setReminderForm({ ...reminderForm, enabled: checked })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveReminder} disabled={!isReminderFormValid} className="w-full h-12">
                        Guardar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {customReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no tienes recordatorios personalizados.</p>
              ) : (
                <ul className="space-y-3">
                  {customReminders.map((reminder) => (
                    <li
                      key={reminder.id}
                      className="bg-muted/30 rounded-lg p-3 flex items-center justify-between gap-3"
                    >
                      <button
                        type="button"
                        className="text-left flex-1"
                        onClick={() => openEditReminderDialog(reminder)}
                      >
                        <p className={reminder.enabled ? '' : 'text-muted-foreground'}>{reminder.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {reminder.time} ·{' '}
                          {reminder.daysOfWeek
                            .map((day) => DAYS_OF_WEEK.find((d) => d.key === day)?.fullLabel ?? day)
                            .join(', ')}
                        </p>
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Eliminar ${reminder.label}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar recordatorio?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará &quot;{reminder.label}&quot;. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteReminder(reminder.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

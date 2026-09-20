import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useProfileStore } from '@/store/profileStore';
import { useReminderStore } from '@/store/reminderStore';
import { useFeaturesStore } from '@/store/featuresStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { loadSubscription } from '@/features/subscription/useCases';
import { UsageLimits } from '@/features/subscription/components/UsageLimits';
import {
  createCustomReminder,
  deleteCustomReminder,
  loadCustomReminders,
  loadProfile,
  loadReminderSettings,
  saveReminderSettings,
  submitProfile,
  updateCustomReminder,
} from '../useCases';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { ProfileEditor } from '../components/ProfileEditor';
import type { SaveCustomReminderData, SaveProfileData, SaveReminderSettingsData } from '@/types';

// Container for /perfil. Loads the profile through the profile store (shared across
// onboarding + editor, and must survive navigation — see docs/architecture/frontend.md's
// Route-may-call-api-directly exception, which does NOT apply here) and picks which
// presentational screen to render: the onboarding wizard when no profile exists yet (a 404
// from GET, surfaced by the store as `profile: null` with no error), or the editor once one
// does. Toasts and navigation live here, not in the presentational components.
//
// Also loads reminder settings/custom reminders (Slice 6, see
// docs/plan/02-vertical-slices.md) once a profile exists — the Recordatorios section is
// rendered from ProfileEditor, not the onboarding wizard, so there's no reminders data to load
// (or section to show) before onboarding completes.
export function ProfileRoute() {
  const { profile, isLoading, error } = useProfileStore();
  const { settings, customReminders, isLoading: isLoadingReminders, isSavingSettings } = useReminderStore();
  const { subscriptions: subscriptionsEnabled } = useFeaturesStore();
  const { subscription } = useSubscriptionStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      void loadReminderSettings();
      void loadCustomReminders();
    }
  }, [profile]);

  // Slice 9: the Free-tier AI usage indicator, gated on the global feature toggle — never
  // fetched (or rendered) while it's off, since /api/subscription genuinely 404s then (see
  // the ticket's fixed HTTP contract).
  useEffect(() => {
    if (profile && subscriptionsEnabled) {
      void loadSubscription();
    }
  }, [profile, subscriptionsEnabled]);

  const handleSave = async (data: SaveProfileData) => {
    setIsSaving(true);
    try {
      await submitProfile(data);
      toast.success('¡Perfil guardado! ✓');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReminderSettings = async (data: SaveReminderSettingsData) => {
    try {
      await saveReminderSettings(data);
      toast.success('¡Recordatorios guardados! ✓');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar los recordatorios');
    }
  };

  const handleCreateReminder = async (data: SaveCustomReminderData) => {
    try {
      await createCustomReminder(data);
      toast.success('¡Recordatorio guardado! ✓');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el recordatorio');
    }
  };

  const handleUpdateReminder = async (id: string, data: SaveCustomReminderData) => {
    try {
      await updateCustomReminder(id, data);
      toast.success('¡Recordatorio actualizado! ✓');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el recordatorio');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteCustomReminder(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el recordatorio');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <button className="underline" onClick={() => void loadProfile()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (profile) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <ProfileEditor
            profile={profile}
            isSaving={isSaving}
            onSave={handleSave}
            reminderSettings={settings}
            customReminders={customReminders}
            isLoadingReminders={isLoadingReminders}
            isSavingReminderSettings={isSavingSettings}
            onSaveReminderSettings={handleSaveReminderSettings}
            onCreateReminder={handleCreateReminder}
            onUpdateReminder={handleUpdateReminder}
            onDeleteReminder={handleDeleteReminder}
          />
          {subscriptionsEnabled && subscription?.tier === 'Free' && (
            <UsageLimits mealAnalysis={subscription.mealAnalysisUsage} chatMessages={subscription.chatMessagesUsage} />
          )}
        </div>
      </div>
    );
  }

  return <OnboardingWizard isSaving={isSaving} onComplete={handleSave} />;
}

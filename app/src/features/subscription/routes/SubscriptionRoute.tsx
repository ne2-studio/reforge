import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { loadSubscription, startCheckout, startPortal } from '../useCases';
import { UsageLimits } from '../components/UsageLimits';
import { UpgradeDialog } from '../components/UpgradeDialog';
import { Button } from '@/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/components/ui/card';
import { Badge } from '@/design-system/components/ui/badge';

const STATUS_LABELS: Record<string, string> = {
  None: 'Sin suscripción',
  Active: 'Activa',
  Canceled: 'Cancelada',
};

// Container for /suscripcion. Loads the caller's own subscription on mount, shows tier/status
// and (only for Free) the UsageLimits indicator, and drives the two mutating flows: Upgrade
// (opens a confirmation dialog, then starts a simulated checkout and navigates the SPA to its
// same-origin checkoutUrl — see ../useCases/index.ts's startCheckout comment on why not
// window.location) and Manage subscription (starts the simulated portal and navigates there
// directly, no confirmation needed since nothing destructive happens until PortalRoute's own
// "Cancelar suscripción" action). Mirrors ChatRoute's container-vs-presentational split.
export function SubscriptionRoute() {
  const navigate = useNavigate();
  const { subscription, isLoading, error } = useSubscriptionStore();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isStartingPortal, setIsStartingPortal] = useState(false);

  useEffect(() => {
    void loadSubscription();
  }, []);

  const handleConfirmUpgrade = async () => {
    setIsStartingCheckout(true);
    try {
      const checkoutUrl = await startCheckout();
      setIsUpgradeDialogOpen(false);
      navigate(checkoutUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo iniciar el pago');
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsStartingPortal(true);
    try {
      const portalUrl = await startPortal();
      navigate(portalUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo abrir la gestión de la suscripción');
    } finally {
      setIsStartingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/perfil')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <h1 className="text-2xl font-bold text-foreground">Suscripción</h1>

        {isLoading && !subscription && <p className="text-muted-foreground">Cargando…</p>}

        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}

        {subscription && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {subscription.tier === 'Premium' ? 'Plan Premium' : 'Plan Gratuito'}
                  <Badge variant={subscription.status === 'Active' ? 'default' : 'secondary'}>
                    {STATUS_LABELS[subscription.status] ?? subscription.status}
                  </Badge>
                </CardTitle>
                {subscription.currentPeriodEnd && (
                  <CardDescription>
                    Renueva el {subscription.currentPeriodEnd.toLocaleDateString('es-ES')}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {subscription.tier === 'Free' ? (
                  <Button onClick={() => setIsUpgradeDialogOpen(true)}>Actualizar a Premium</Button>
                ) : (
                  <Button variant="outline" onClick={() => void handleManageSubscription()} disabled={isStartingPortal}>
                    {isStartingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gestionar suscripción'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {subscription.tier === 'Free' && (
              <UsageLimits mealAnalysis={subscription.mealAnalysisUsage} chatMessages={subscription.chatMessagesUsage} />
            )}
          </>
        )}

        <UpgradeDialog
          open={isUpgradeDialogOpen}
          onOpenChange={setIsUpgradeDialogOpen}
          isUpgrading={isStartingCheckout}
          onConfirm={() => void handleConfirmUpgrade()}
        />
      </div>
    </div>
  );
}

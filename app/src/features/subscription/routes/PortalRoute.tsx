import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cancelSubscription } from '../useCases';
import { Button } from '@/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';
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

// Container for /suscripcion/portal — a fake "manage subscription" screen standing in for a
// real Stripe customer portal, per the Slice 9 ticket's fixed HTTP contract
// (POST /api/subscription/portal's portalUrl is a same-origin SPA path). Uses this design
// system's <AlertDialog> for the cancel confirmation, same reasoning as
// MealLibraryList's delete confirmation, since cancelling ends the caller's Premium access.
export function PortalRoute() {
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelSubscription();
      toast.success('Suscripción cancelada');
      navigate('/suscripcion');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cancelar la suscripción');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Gestionar suscripción</CardTitle>
          <CardDescription>Esta es una gestión de suscripción simulada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isCancelling} className="w-full">
                {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar suscripción'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar tu suscripción?</AlertDialogTitle>
                <AlertDialogDescription>
                  Perderás el acceso a análisis de comidas y mensajes al coach de IA ilimitados, y volverás al
                  plan gratuito.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleCancel()}>Cancelar suscripción</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" onClick={() => navigate('/suscripcion')} className="w-full">
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

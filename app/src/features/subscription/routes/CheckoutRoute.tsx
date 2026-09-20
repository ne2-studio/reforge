import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { confirmCheckout } from '../useCases';
import { Button } from '@/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';

// Container for /suscripcion/checkout?session=<id> — a fake payment screen, per the Slice 9
// ticket's fixed HTTP contract (POST /api/subscription/checkout's checkoutUrl is a
// same-origin SPA path this app's own router serves, not a real Stripe redirect). `session`
// is read from the query string the same way CallbackRoute reads `code`. "Confirmar" calls
// confirmCheckout, then goes back to /suscripcion so the caller immediately sees their new
// Premium tier.
export function CheckoutRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!sessionId) return;
    setIsConfirming(true);
    try {
      await confirmCheckout(sessionId);
      toast.success('¡Suscripción actualizada a Premium! ✓');
      navigate('/suscripcion');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo confirmar el pago');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Confirmar pago</CardTitle>
          <CardDescription>Este es un checkout simulado, no se realizará ningún cargo real.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionId ? (
            <p role="alert" className="text-destructive text-sm">
              No se encontró la sesión de pago.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Plan Premium — análisis de comidas y mensajes al coach de IA ilimitados.</p>
              <Button onClick={() => void handleConfirm()} disabled={isConfirming} className="w-full">
                {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => navigate('/suscripcion')} className="w-full">
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

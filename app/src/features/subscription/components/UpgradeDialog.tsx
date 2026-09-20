import { Loader2 } from 'lucide-react';
import { Button } from '@/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/components/ui/dialog';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isUpgrading: boolean;
  onConfirm: () => void;
}

// Presentational — no react-router-dom/store/useCases imports. A confirmation step before
// SubscriptionRoute starts a (simulated) Stripe checkout — kept separate from
// AILimitReached, which only ever navigates to /suscripcion and never itself calls checkout,
// so there's exactly one place in the app that actually starts a payment flow.
export function UpgradeDialog({ open, onOpenChange, isUpgrading, onConfirm }: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar a Premium</DialogTitle>
          <DialogDescription>
            Con Premium tienes análisis de comidas y mensajes al coach de IA ilimitados, sin los límites
            mensuales del plan gratuito.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpgrading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isUpgrading}>
            {isUpgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar a Premium'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

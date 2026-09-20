import { Sparkles } from 'lucide-react';
import { Button } from '@/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/components/ui/dialog';

interface AILimitReachedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: 'mealAnalysis' | 'chatMessages';
  onUpgrade: () => void;
}

const FEATURE_COPY: Record<AILimitReachedProps['feature'], string> = {
  mealAnalysis: 'Has alcanzado tu límite mensual de análisis de comidas con IA.',
  chatMessages: 'Has alcanzado tu límite mensual de mensajes al coach de IA.',
};

// Presentational — no react-router-dom/store/useCases imports. Shown by MealsRoute/ChatRoute
// in place of the generic error toast when the backend reports the caller's monthly AI-usage
// limit hit (a 403 on the meal-analysis/chat-send endpoint, only ever interpreted this way
// when featuresStore.subscriptions is true — see those routes' own comments). `onUpgrade`
// only ever navigates to /suscripcion; it never itself starts checkout, that's
// SubscriptionRoute + UpgradeDialog's job.
export function AILimitReached({ open, onOpenChange, feature, onUpgrade }: AILimitReachedProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Límite de IA alcanzado
          </DialogTitle>
          <DialogDescription>{FEATURE_COPY[feature]}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={onUpgrade}>Actualizar a Premium</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

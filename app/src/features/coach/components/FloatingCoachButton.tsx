import { MessageCircle } from 'lucide-react';
import { Button } from '@/design-system/components/ui/button';

interface FloatingCoachButtonProps {
  onClick: () => void;
}

// Presentational — no react-router-dom/store/useCases imports. Ported from
// reforge-frontend/src/components/FloatingCoachButton.tsx: fixed, bottom-right, circular. Drops
// the source's `showBadge` prop (an unread/AI-limit nudge) since nothing in this slice's scope
// produces that signal (YAGNI — see the ticket's decision 4 reasoning for the same call on
// MealLogger's imperative handle).
export function FloatingCoachButton({ onClick }: FloatingCoachButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-20 h-14 w-14 rounded-full shadow-lg"
      size="icon"
      title="Habla con tu coach"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}

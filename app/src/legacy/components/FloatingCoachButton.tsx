import { MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

interface FloatingCoachButtonProps {
  onClick: () => void;
  showBadge?: boolean;
}

export function FloatingCoachButton({ onClick, showBadge }: FloatingCoachButtonProps) {
  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-20 group">
      <Button
        onClick={onClick}
        className="h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90 relative"
        size="icon"
        title={showBadge ? "¡El coach tiene consejos para ti!" : "Habla con tu coach"}
      >
        <MessageCircle className="h-6 w-6" />
        {showBadge && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse" />
        )}
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-card border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        <p className="text-sm">
          {showBadge ? "💡 ¡Tienes consejos!" : "💬 Habla con tu coach"}
        </p>
      </div>
    </div>
  );
}

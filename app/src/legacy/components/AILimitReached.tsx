import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";

interface AILimitReachedProps {
  type: "meal" | "chat";
  onUpgrade: () => void;
  onContinueWithoutAI?: () => void;
}

export function AILimitReached({ type, onUpgrade, onContinueWithoutAI }: AILimitReachedProps) {
  const isMeal = type === "meal";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="mb-6 w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-accent" />
      </div>

      {isMeal ? (
        <>
          <h3 className="text-lg font-medium mb-3">
            Este era uno de tus últimos análisis gratis
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
            El coach funciona mejor cuando te acompaña a diario. Con análisis ilimitados, puedes
            hacer ajustes reales y ver progreso consistente.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium mb-3">El coach gratuito llega hasta aquí</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
            Para seguimiento diario y ajustes reales, necesitas el plan completo. El coaching
            funciona con conversación continua, no solo con registros.
          </p>
        </>
      )}

      <div className="w-full max-w-sm space-y-3">
        <Button onClick={onUpgrade} className="w-full h-12 text-base" size="lg">
          <Sparkles className="mr-2 h-4 w-4" />
          {isMeal ? "Desbloquear análisis ilimitados" : "Activar coach completo"}
        </Button>

        {isMeal && onContinueWithoutAI && (
          <Button
            variant="outline"
            onClick={onContinueWithoutAI}
            className="w-full h-12 text-base"
          >
            Guardar comida sin analizar
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Puedes seguir usando todas las funciones básicas gratis
      </p>
    </div>
  );
}

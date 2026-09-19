import { Sparkles, MessageSquare } from "lucide-react";

interface UsageLimitsProps {
  mealAnalysisUsed: number;
  mealAnalysisLimit: number;
  chatMessagesUsed: number;
  chatMessagesLimit: number;
  isPro?: boolean;
}

export function UsageLimits({
  mealAnalysisUsed,
  mealAnalysisLimit,
  chatMessagesUsed,
  chatMessagesLimit,
  isPro = false,
}: UsageLimitsProps) {
  if (isPro) {
    return null; // No mostrar para usuarios Pro
  }

  const mealPercentage = (mealAnalysisUsed / mealAnalysisLimit) * 100;
  const chatPercentage = (chatMessagesUsed / chatMessagesLimit) * 100;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "text-red-400";
    if (percentage >= 80) return "text-yellow-400";
    return "text-accent";
  };

  return (
    <div className="bg-card rounded-2xl p-4 border-2 border-border">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h4 className="text-sm font-medium">Uso de IA gratuito</h4>
      </div>

      <div className="space-y-3">
        {/* Análisis de comidas */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Análisis de comidas</span>
            <span className={`font-medium ${getStatusColor(mealPercentage)}`}>
              {mealAnalysisUsed} / {mealAnalysisLimit}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                mealPercentage >= 100
                  ? "bg-red-400"
                  : mealPercentage >= 80
                  ? "bg-yellow-400"
                  : "bg-accent"
              }`}
              style={{ width: `${Math.min(mealPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Mensajes de chat */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Mensajes con coach</span>
            <span className={`font-medium ${getStatusColor(chatPercentage)}`}>
              {chatMessagesUsed} / {chatMessagesLimit}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                chatPercentage >= 100
                  ? "bg-red-400"
                  : chatPercentage >= 80
                  ? "bg-yellow-400"
                  : "bg-accent"
              }`}
              style={{ width: `${Math.min(chatPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {(mealPercentage >= 80 || chatPercentage >= 80) && (
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          El coach funciona mejor cuando te acompaña a diario
        </p>
      )}
    </div>
  );
}

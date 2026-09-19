import { CheckCircle, TrendingUp, Lightbulb } from "lucide-react";

interface DaySummaryProps {
  summary: {
    date: string;
    totals: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    hadWorkout: boolean;
    summary: {
      positives: string[];
      improvements: string[];
      tomorrowTips: string[];
    };
  };
}

export function DaySummary({ summary }: DaySummaryProps) {
  return (
    <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-5 border-2 border-accent/30">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-accent" />
        <h4 className="font-medium text-foreground">Resumen del día</h4>
      </div>

      {/* Totales */}
      <div className="bg-background/60 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Calorías</p>
            <p className="font-medium text-primary">{Math.round(summary.totals.calories)} kcal</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Proteína</p>
            <p className="font-medium text-accent">{Math.round(summary.totals.protein)}g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Carbos</p>
            <p className="font-medium text-blue-400">{Math.round(summary.totals.carbs)}g</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Grasas</p>
            <p className="font-medium text-yellow-400">{Math.round(summary.totals.fats)}g</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {summary.hadWorkout ? "💪 Día de entrenamiento" : "😌 Día de descanso"}
          </p>
        </div>
      </div>

      {/* Feedback del coach */}
      <div className="space-y-3">
        {/* Positivos */}
        {summary.summary.positives && summary.summary.positives.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium">Puntos positivos</p>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {summary.summary.positives.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mejoras */}
        {summary.summary.improvements && summary.summary.improvements.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <p className="text-sm font-medium">Oportunidades de mejora</p>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {summary.summary.improvements.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recomendaciones para mañana */}
        {summary.summary.tomorrowTips && summary.summary.tomorrowTips.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Para mañana</p>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {summary.summary.tomorrowTips.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Este resumen se ha guardado en tu historial 📚
        </p>
      </div>
    </div>
  );
}

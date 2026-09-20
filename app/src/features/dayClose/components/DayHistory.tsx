import { Badge } from '@/design-system/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';
import type { ClosedDay } from '@/types';

interface DayHistoryProps {
  days: ClosedDay[];
  isLoading: boolean;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Presentational — no react-router-dom/store/useCases imports. "Días cerrados" tab of
// /historial: GET /day-history's list, most recent first (already sorted by the backend) —
// date, total calories, meal count, whether it was a training day, and the analysis text.
export function DayHistory({ days, isLoading }: DayHistoryProps) {
  if (isLoading && days.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Sin historial aún
            <br />
            Cierra tu primer día para empezar a construir tu historial
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <Card key={day.date} className="border-2 border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="capitalize text-base">{formatDate(day.date)}</CardTitle>
              <Badge variant={day.isTrainingDay ? 'default' : 'secondary'}>
                {day.isTrainingDay ? 'Día de entrenamiento' : 'Día de descanso'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
              <span>{day.totalCalories} kcal</span>
              <span>
                {day.mealsCount} {day.mealsCount === 1 ? 'comida' : 'comidas'}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{day.analysis}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

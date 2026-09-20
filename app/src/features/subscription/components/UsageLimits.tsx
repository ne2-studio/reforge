import { Progress } from '@/design-system/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/design-system/components/ui/card';

interface UsageLimitsProps {
  mealAnalysis: { count: number; limit: number };
  chatMessages: { count: number; limit: number };
}

// Presentational — no react-router-dom/store/useCases imports. Shows the Free tier's monthly
// AI usage (meal analysis + coach chat) as two progress bars. Callers (ProfileRoute,
// SubscriptionRoute) are responsible for only rendering this when both
// featuresStore.subscriptions and `tier === 'Free'` hold — a Premium row's `limit` field is
// always 10 regardless of tier per this backend's current design, so this component would
// otherwise show a misleading "X of 10" for someone who's actually unlimited.
export function UsageLimits({ mealAnalysis, chatMessages }: UsageLimitsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso de IA este mes</CardTitle>
        <CardDescription>Tu plan gratuito incluye 10 usos al mes de cada función de IA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Análisis de comidas con IA</span>
            <span className="text-muted-foreground">
              {mealAnalysis.count} / {mealAnalysis.limit}
            </span>
          </div>
          <Progress value={(mealAnalysis.count / mealAnalysis.limit) * 100} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>Mensajes al coach de IA</span>
            <span className="text-muted-foreground">
              {chatMessages.count} / {chatMessages.limit}
            </span>
          </div>
          <Progress value={(chatMessages.count / chatMessages.limit) * 100} />
        </div>
      </CardContent>
    </Card>
  );
}

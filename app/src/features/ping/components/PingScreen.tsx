import { Button } from '@/design-system/components/ui/button';
import { Card } from '@/design-system/components/ui/card';
import type { PingResult } from '@/types';

interface PingScreenProps {
  result: PingResult | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSignOut: () => void;
  onGoToProfile: () => void;
  onGoToMeals: () => void;
  onGoToMealLibrary: () => void;
  onGoToActivity: () => void;
  onGoToWorkouts: () => void;
  onGoToProgress: () => void;
  showSubscription: boolean;
  onGoToSubscription: () => void;
}

// Presentational — no react-router-dom/store/useCases imports. The one real authenticated
// screen for the walking skeleton (docs/plan/01-walking-skeleton.md): shows the result of
// calling the backend's authenticated `GET /ping` with the OIDC access token. Also the app's
// minimal nav affordance to `/perfil` (Slice 1), `/comidas` (Slice 2), `/biblioteca-comidas`
// (Slice 3), `/actividad`/`/entrenamientos` (Slice 4), and `/progreso` (Slice 5) — there's no
// real home screen yet.
export function PingScreen({
  result,
  isLoading,
  error,
  onRetry,
  onSignOut,
  onGoToProfile,
  onGoToMeals,
  onGoToMealLibrary,
  onGoToActivity,
  onGoToWorkouts,
  onGoToProgress,
  showSubscription,
  onGoToSubscription,
}: PingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <Card className="max-w-md w-full p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Ping autenticado</h1>

        {isLoading && <p className="text-muted-foreground">Consultando la API…</p>}

        {error && !isLoading && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}

        {result && !isLoading && !error && (
          <div className="space-y-1 text-left bg-muted rounded-md p-4">
            <p className="text-sm text-muted-foreground">Usuario sincronizado</p>
            <p className="font-mono text-sm text-foreground">{result.userId}</p>
            <p className="text-sm text-muted-foreground mt-2">Marca de tiempo</p>
            <p className="font-mono text-sm text-foreground">{result.timestamp.toISOString()}</p>
          </div>
        )}

        <div className="flex gap-2 justify-center pt-2">
          <Button variant="outline" onClick={onRetry} disabled={isLoading}>
            Reintentar
          </Button>
          <Button variant="secondary" onClick={onGoToProfile}>
            Mi perfil
          </Button>
          <Button variant="secondary" onClick={onGoToMeals}>
            Comidas
          </Button>
          <Button variant="secondary" onClick={onGoToMealLibrary}>
            Biblioteca
          </Button>
          <Button variant="secondary" onClick={onGoToActivity}>
            Actividad
          </Button>
          <Button variant="secondary" onClick={onGoToWorkouts}>
            Entrenamientos
          </Button>
          <Button variant="secondary" onClick={onGoToProgress}>
            Progreso
          </Button>
          {showSubscription && (
            <Button variant="secondary" onClick={onGoToSubscription}>
              Suscripción
            </Button>
          )}
          <Button variant="ghost" onClick={onSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}

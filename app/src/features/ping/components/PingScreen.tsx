import { Button } from '@/design-system/components/ui/button';
import { Card } from '@/design-system/components/ui/card';
import type { PingResult } from '@/types';

interface PingScreenProps {
  result: PingResult | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSignOut: () => void;
}

// Presentational — no react-router-dom/store/useCases imports. The one real authenticated
// screen for the walking skeleton (docs/plan/01-walking-skeleton.md): shows the result of
// calling the backend's authenticated `GET /ping` with the OIDC access token.
export function PingScreen({ result, isLoading, error, onRetry, onSignOut }: PingScreenProps) {
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
          <Button variant="ghost" onClick={onSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}

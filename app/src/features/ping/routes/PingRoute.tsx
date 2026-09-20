import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import type { PingResult } from '@/types';
import { PingScreen } from '../components/PingScreen';

// Container: fetches from the API directly (allowed exception in
// docs/architecture/frontend.md — the ping result is never cached or shared across routes,
// so there's no state a store would own). Navigation/sign-out live here, not in PingScreen.
export function PingRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<PingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPing = () => {
    setIsLoading(true);
    setError(null);
    api.ping
      .ping()
      .then(setResult)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudo contactar con la API');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPing();
  }, []);

  const handleSignOut = () => {
    void auth.removeUser();
  };

  return (
    <PingScreen
      result={result}
      isLoading={isLoading}
      error={error}
      onRetry={loadPing}
      onSignOut={handleSignOut}
      onGoToProfile={() => navigate('/perfil')}
      onGoToMeals={() => navigate('/comidas')}
      onGoToMealLibrary={() => navigate('/biblioteca-comidas')}
      onGoToActivity={() => navigate('/actividad')}
      onGoToWorkouts={() => navigate('/entrenamientos')}
      onGoToProgress={() => navigate('/progreso')}
      onGoToHistory={() => navigate('/historial')}
    />
  );
}

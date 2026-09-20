import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Reached only via the OIDC provider's redirect back after an actual login (redirect_uri —
// see main.tsx). A rehydrated/persisted session on a normal page load never routes through
// here. Mirrors el-baul's features/auth/routes/CallbackRoute.tsx.
export function CallbackRoute() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/home', { replace: true });
      return;
    }

    // No `code` in the query string means there's nothing for the OIDC client to process
    // (e.g. a stray visit to this URL) — without this check it would spin forever.
    if (!auth.isLoading && !searchParams.has('code')) {
      navigate('/', { replace: true });
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <p className="text-lg text-muted-foreground">Iniciando sesión…</p>
    </div>
  );
}

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import { setAccessToken } from '@/api';
import { ProtectedRoute, PublicRoute } from './routes/AuthGuards';
import { WelcomeRoute } from '@/features/auth/routes/WelcomeRoute';
import { CallbackRoute } from '@/features/auth/routes/CallbackRoute';
import { PingRoute } from '@/features/ping/routes/PingRoute';

// Owns routing, the auth redirect gate, and pushing the OIDC access token into api.ts on
// every auth-state change — see docs/architecture/frontend.md.
function App() {
  const auth = useAuth();

  // Mirrored into api.ts synchronously during render, not in an effect: a hard refresh can
  // let a protected route mount in the very same commit where auth.isAuthenticated first
  // flips to true, and passive effects fire child-first — a child's data-loading effect
  // would then run before this component's own effect got a chance to push the token,
  // calling the API with none attached. A plain synchronous assignment has no such
  // ordering risk (same reasoning as el-baul's app/App.tsx).
  setAccessToken(auth.user?.access_token ?? null);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <WelcomeRoute />
          </PublicRoute>
        }
      />
      <Route path="/callback" element={<CallbackRoute />} />
      <Route
        path="/ping"
        element={
          <ProtectedRoute>
            <PingRoute />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

interface GuardProps {
  children: React.ReactNode;
}

// auth.isAuthenticated starts false while the OIDC user is still being rehydrated from
// localStorage — without this guard, a hard refresh on the protected route would bounce
// straight to "/" before rehydration even had a chance to resolve. Mirrors el-baul's
// app/routes/AuthGuards.tsx (RequireAuth/ProtectedRoute/PublicRoute).
export const ProtectedRoute: React.FC<GuardProps> = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;

  if (!auth.isAuthenticated) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?redirectTo=${redirectTo}`} replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<GuardProps> = ({ children }) => {
  const auth = useAuth();

  if (auth.isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>;

  if (auth.isAuthenticated) {
    return <Navigate to="/ping" replace />;
  }

  return <>{children}</>;
};

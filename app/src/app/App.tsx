import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import { setAccessToken } from '@/api';
import { ProtectedRoute, PublicRoute } from './routes/AuthGuards';
import { WelcomeRoute } from '@/features/auth/routes/WelcomeRoute';
import { CallbackRoute } from '@/features/auth/routes/CallbackRoute';
import { PingRoute } from '@/features/ping/routes/PingRoute';
import { ProfileRoute } from '@/features/profile/routes/ProfileRoute';
import { MealsRoute } from '@/features/meals/routes/MealsRoute';
import { MealLibraryRoute } from '@/features/mealLibrary/routes/MealLibraryRoute';
import { ActivityRoute } from '@/features/activities/routes/ActivityRoute';
import { WorkoutRoute } from '@/features/workouts/routes/WorkoutRoute';
import { ProgressRoute } from '@/features/measurements/routes/ProgressRoute';
import { HistoryRoute } from '@/features/dayClose/routes/HistoryRoute';
import { ChatRoute } from '@/features/coach/routes/ChatRoute';
import { SubscriptionRoute } from '@/features/subscription/routes/SubscriptionRoute';
import { CheckoutRoute } from '@/features/subscription/routes/CheckoutRoute';
import { PortalRoute } from '@/features/subscription/routes/PortalRoute';
import { useFeaturesStore } from '@/store/featuresStore';
import { loadFeatures } from '@/features/subscription/useCases';

// Owns routing, the auth redirect gate, and pushing the OIDC access token into api.ts on
// every auth-state change — see docs/architecture/frontend.md.
function App() {
  const auth = useAuth();
  const { subscriptions: subscriptionsEnabled, isLoaded: featuresLoaded } = useFeaturesStore();

  // Mirrored into api.ts synchronously during render, not in an effect: a hard refresh can
  // let a protected route mount in the very same commit where auth.isAuthenticated first
  // flips to true, and passive effects fire child-first — a child's data-loading effect
  // would then run before this component's own effect got a chance to push the token,
  // calling the API with none attached. A plain synchronous assignment has no such
  // ordering risk (same reasoning as el-baul's app/App.tsx).
  setAccessToken(auth.user?.access_token ?? null);

  // Slice 9's global feature toggle: `GET /api/features` is `[AllowAnonymous]` and cheap, but
  // gating /suscripcion* below only matters once the caller is authenticated (unauthenticated
  // visitors never see any route that would need it), so this loads once per sign-in rather
  // than on every render or on first mount of some specific feature route. There's no other
  // "load once on auth" hook in this codebase yet to hang this off of (see the ticket's own
  // note on this) — App.tsx is the least surprising place, since it already owns the
  // auth-state effect above for the same "runs once per sign-in" reason.
  useEffect(() => {
    if (auth.isAuthenticated && !featuresLoaded) {
      void loadFeatures();
    }
  }, [auth.isAuthenticated, featuresLoaded]);

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
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <ProfileRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comidas"
        element={
          <ProtectedRoute>
            <MealsRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/biblioteca-comidas"
        element={
          <ProtectedRoute>
            <MealLibraryRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/actividad"
        element={
          <ProtectedRoute>
            <ActivityRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entrenamientos"
        element={
          <ProtectedRoute>
            <WorkoutRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progreso"
        element={
          <ProtectedRoute>
            <ProgressRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historial"
        element={
          <ProtectedRoute>
            <HistoryRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suscripcion"
        element={
          <ProtectedRoute>
            {subscriptionsEnabled ? <SubscriptionRoute /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/suscripcion/checkout"
        element={
          <ProtectedRoute>
            {subscriptionsEnabled ? <CheckoutRoute /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/suscripcion/portal"
        element={
          <ProtectedRoute>
            {subscriptionsEnabled ? <PortalRoute /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

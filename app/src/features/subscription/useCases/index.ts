import { api } from '@/api';
import { useFeaturesStore } from '@/store/featuresStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

// Orchestration layer for the feature toggle + Suscripción (Slice 9) — see
// docs/architecture/frontend.md's `useCases/` layer, mirroring features/coach/useCases/
// index.ts's error-handling/store-update pattern: `load*` functions swallow their error into
// the store's `error` field, mutating functions (checkout/confirm/portal/cancel) re-throw
// after recording it, so a failed action doesn't silently look like nothing happened (same
// reasoning as history's loadWeeklyProgress).
//
// Every function below except loadFeatures must only ever be called once
// featuresStore.subscriptions is true — /api/subscription* genuinely doesn't exist
// server-side otherwise (see the ticket's fixed HTTP contract), so callers (routes/
// components) are responsible for that gating, not this module.

// Backs App.tsx's one-time `GET /api/features` load on auth (see that file's comment for why
// there). Fails closed: if the probe itself can't be reached, subscriptions stays `false`
// rather than risk calling routes that may not exist.
export async function loadFeatures(): Promise<void> {
  try {
    const { subscriptions } = await api.features.get();
    useFeaturesStore.setState({ subscriptions, isLoaded: true });
  } catch {
    useFeaturesStore.setState({ subscriptions: false, isLoaded: true });
  }
}

export async function loadSubscription(): Promise<void> {
  useSubscriptionStore.setState({ isLoading: true, error: null });
  try {
    const subscription = await api.subscription.get();
    useSubscriptionStore.setState({ subscription, isLoading: false });
  } catch (error) {
    useSubscriptionStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar la suscripción',
      isLoading: false,
    });
  }
}

// Starts a simulated checkout session and returns its (same-origin, SPA-relative)
// checkoutUrl — SubscriptionRoute navigates to it with react-router-dom, not window.location,
// per the ticket's fixed HTTP contract.
export async function startCheckout(): Promise<string> {
  try {
    return await api.subscription.checkout();
  } catch (error) {
    useSubscriptionStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo iniciar el pago',
    });
    throw error;
  }
}

// Confirms a simulated checkout session, then reloads the subscription so callers immediately
// see the caller's new Premium/Active tier — mirrors loadWeeklyProgress's own "mutate, then reload the
// dependent read state" shape.
export async function confirmCheckout(sessionId: string): Promise<void> {
  useSubscriptionStore.setState({ isLoading: true, error: null });
  try {
    await api.subscription.confirmCheckout(sessionId);
    await loadSubscription();
  } catch (error) {
    useSubscriptionStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo confirmar el pago',
      isLoading: false,
    });
    throw error;
  }
}

export async function startPortal(): Promise<string> {
  try {
    return await api.subscription.portal();
  } catch (error) {
    useSubscriptionStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo abrir la gestión de la suscripción',
    });
    throw error;
  }
}

export async function cancelSubscription(): Promise<void> {
  useSubscriptionStore.setState({ isLoading: true, error: null });
  try {
    await api.subscription.cancel();
    await loadSubscription();
  } catch (error) {
    useSubscriptionStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cancelar la suscripción',
      isLoading: false,
    });
    throw error;
  }
}

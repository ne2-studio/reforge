import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubscriptionStore } from './subscriptionStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    subscription: {
      get: vi.fn(),
      checkout: vi.fn(),
      confirmCheckout: vi.fn(),
      portal: vi.fn(),
      cancel: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import {
  loadSubscription,
  startCheckout,
  confirmCheckout,
  startPortal,
  cancelSubscription,
} from '@/features/subscription/useCases';
import { Subscription } from '@/types';

const freeDto = {
  tier: 'Free' as const,
  status: 'None' as const,
  currentPeriodEnd: null,
  usage: {
    mealAnalysis: { count: 3, limit: 10 },
    chatMessages: { count: 5, limit: 10 },
  },
};

const premiumDto = {
  tier: 'Premium' as const,
  status: 'Active' as const,
  currentPeriodEnd: '2026-10-20T00:00:00Z',
  usage: {
    mealAnalysis: { count: 0, limit: 10 },
    chatMessages: { count: 0, limit: 10 },
  },
};

describe('subscriptionStore + subscription useCases', () => {
  beforeEach(() => {
    useSubscriptionStore.setState({ subscription: null, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadSubscription populates the store on success', async () => {
    vi.mocked(api.subscription.get).mockResolvedValue(new Subscription(freeDto));

    await loadSubscription();

    const state = useSubscriptionStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.subscription?.tier).toBe('Free');
    expect(state.subscription?.mealAnalysisUsage).toEqual({ count: 3, limit: 10 });
  });

  it('loadSubscription records an error message on failure', async () => {
    vi.mocked(api.subscription.get).mockRejectedValue(new Error('network down'));

    await loadSubscription();

    const state = useSubscriptionStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('startCheckout returns the checkout URL without touching the stored subscription', async () => {
    vi.mocked(api.subscription.checkout).mockResolvedValue('/suscripcion/checkout?session=abc-123');

    const url = await startCheckout();

    expect(url).toBe('/suscripcion/checkout?session=abc-123');
    expect(useSubscriptionStore.getState().subscription).toBeNull();
  });

  it('startCheckout propagates its error without swallowing it into the store', async () => {
    vi.mocked(api.subscription.checkout).mockRejectedValue(new Error('No se pudo iniciar el pago'));

    await expect(startCheckout()).rejects.toThrow('No se pudo iniciar el pago');
  });

  it('confirmCheckout confirms the session, then reloads the subscription', async () => {
    vi.mocked(api.subscription.confirmCheckout).mockResolvedValue(undefined);
    vi.mocked(api.subscription.get).mockResolvedValue(new Subscription(premiumDto));

    await confirmCheckout('abc-123');

    expect(api.subscription.confirmCheckout).toHaveBeenCalledWith('abc-123');
    expect(useSubscriptionStore.getState().subscription?.tier).toBe('Premium');
  });

  it('confirmCheckout propagates its error without reloading the subscription', async () => {
    vi.mocked(api.subscription.confirmCheckout).mockRejectedValue(new Error('Esta sesión ya fue confirmada'));

    await expect(confirmCheckout('abc-123')).rejects.toThrow('Esta sesión ya fue confirmada');
    expect(api.subscription.get).not.toHaveBeenCalled();
  });

  it('startPortal returns the portal URL', async () => {
    vi.mocked(api.subscription.portal).mockResolvedValue('/suscripcion/portal');

    const url = await startPortal();

    expect(url).toBe('/suscripcion/portal');
  });

  it('cancelSubscription cancels, then reloads the subscription', async () => {
    vi.mocked(api.subscription.cancel).mockResolvedValue(undefined);
    vi.mocked(api.subscription.get).mockResolvedValue(new Subscription(freeDto));

    await cancelSubscription();

    expect(api.subscription.cancel).toHaveBeenCalledTimes(1);
    expect(useSubscriptionStore.getState().subscription?.tier).toBe('Free');
  });

  it('reset clears the store back to its initial state', () => {
    useSubscriptionStore.setState({
      subscription: new Subscription(freeDto),
      isLoading: true,
      error: 'x',
    });

    useSubscriptionStore.getState().reset();

    expect(useSubscriptionStore.getState()).toMatchObject({
      subscription: null,
      isLoading: false,
      error: null,
    });
  });
});

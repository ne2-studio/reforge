import { get, post } from '../http';
import { Subscription, type SubscriptionDtoShape } from '../../types';

// Wire shape of POST /api/subscription/checkout's response — a same-origin SPA path (this
// app's own router already serves it), never a real external URL, per the Slice 9 ticket's
// fixed HTTP contract. Only used here to unwrap the field, same reasoning as coach.ts's
// SendChatMessageResponseDtoShape.
interface CheckoutResponseDtoShape {
  checkoutUrl: string;
}

interface PortalResponseDtoShape {
  portalUrl: string;
}

// Every function here must only be called once featuresStore.subscriptions is true — these
// routes genuinely don't exist server-side otherwise (see docs/plan/02-vertical-slices.md's
// Slice 9 entry and this ticket's fixed HTTP contract), so calling them behind a false flag
// is a caller bug, not a 404 this resource should try to paper over.
export const subscriptionApi = {
  // GET /api/subscription — the caller's own tier/status/usage.
  async get(): Promise<Subscription> {
    const data = await get<SubscriptionDtoShape>('/api/subscription');
    return new Subscription(data);
  },

  // POST /api/subscription/checkout — starts a simulated Stripe checkout, no body.
  async checkout(): Promise<string> {
    const data = await post<CheckoutResponseDtoShape>('/api/subscription/checkout', undefined);
    return data.checkoutUrl;
  },

  // POST /api/subscription/checkout/{sessionId}/confirm — confirms a simulated checkout
  // session, no body/response payload. May fail (400/403/404) if the session doesn't belong
  // to the caller or was already confirmed.
  async confirmCheckout(sessionId: string): Promise<void> {
    await post<undefined>(`/api/subscription/checkout/${sessionId}/confirm`, undefined);
  },

  // POST /api/subscription/portal — opens a simulated Stripe customer portal, no body.
  async portal(): Promise<string> {
    const data = await post<PortalResponseDtoShape>('/api/subscription/portal', undefined);
    return data.portalUrl;
  },

  // POST /api/subscription/cancel — cancels the caller's subscription, no body/response
  // payload.
  async cancel(): Promise<void> {
    await post<undefined>('/api/subscription/cancel', undefined);
  },
};

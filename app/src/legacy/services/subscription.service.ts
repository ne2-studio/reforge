import { SubscriptionStatus } from "../types";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export const subscriptionService = {
  async getSubscriptionStatus(accessToken: string): Promise<{ subscription: SubscriptionStatus }> {
    const response = await fetch(`${BASE_URL}/subscription`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load subscription status: ${response.status}`);
    }

    return response.json();
  },

  async createCheckoutSession(accessToken: string): Promise<{ url: string }> {
    const response = await fetch(`${BASE_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create checkout session: ${response.status}`);
    }

    return response.json();
  },

  async createPortalSession(accessToken: string): Promise<{ url: string }> {
    const response = await fetch(`${BASE_URL}/create-portal-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create portal session: ${response.status}`);
    }

    return response.json();
  }
};

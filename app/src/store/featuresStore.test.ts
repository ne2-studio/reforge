import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFeaturesStore } from './featuresStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    features: {
      get: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadFeatures } from '@/features/subscription/useCases';

describe('featuresStore + subscription useCases#loadFeatures', () => {
  beforeEach(() => {
    useFeaturesStore.setState({ subscriptions: false, isLoaded: false });
    vi.clearAllMocks();
  });

  it('loadFeatures populates the store on success', async () => {
    vi.mocked(api.features.get).mockResolvedValue({ subscriptions: true });

    await loadFeatures();

    expect(useFeaturesStore.getState()).toMatchObject({ subscriptions: true, isLoaded: true });
  });

  it('loadFeatures fails closed (subscriptions: false) if the request fails', async () => {
    vi.mocked(api.features.get).mockRejectedValue(new Error('network down'));

    await loadFeatures();

    expect(useFeaturesStore.getState()).toMatchObject({ subscriptions: false, isLoaded: true });
  });

  it('reset clears the store back to its initial state', () => {
    useFeaturesStore.setState({ subscriptions: true, isLoaded: true });

    useFeaturesStore.getState().reset();

    expect(useFeaturesStore.getState()).toMatchObject({ subscriptions: false, isLoaded: false });
  });
});

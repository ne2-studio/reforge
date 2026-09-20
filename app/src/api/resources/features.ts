import { get } from '../http';

// Wire shape of GET /api/features — a global, `[AllowAnonymous]` feature-toggle probe (see
// the Slice 9 ticket's fixed HTTP contract). Kept as its own tiny resource, not folded into
// subscription.ts, since it's fetched once on auth regardless of whether the subscription
// feature ends up enabled, and must be safe to call even while /api/subscription* itself
// genuinely 404s.
export interface FeaturesDtoShape {
  subscriptions: boolean;
}

export const featuresApi = {
  async get(): Promise<FeaturesDtoShape> {
    return get<FeaturesDtoShape>('/api/features');
  },
};

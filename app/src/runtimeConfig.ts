declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

type RuntimeEnvKey =
  | 'VITE_API_URL'
  | 'VITE_OIDC_AUTHORITY'
  | 'VITE_OIDC_CLIENT_ID'
  | 'VITE_OIDC_CALLBACK_URI'
  | 'VITE_ZITADEL_ORGANIZATION_ID';

// Runtime override (window.__ENV__, from env-config.js rendered out of
// public/env-config.template.js) wins when present and non-empty; otherwise falls back to the
// Vite build-time value. In production (Cloudflare Pages) the frontend CI/CD workflow renders
// env-config.js into dist/ at deploy time; the Docker image (used by the acceptance tests and
// local compose) renders it at container start via docker-entrypoint.d/95-generate-runtime-env.sh,
// so one built image can be pointed at a different API / OIDC provider without rebuilding.
// Mirrors el-baul's src/runtimeConfig.ts.
export function getEnv(key: RuntimeEnvKey): string {
  return window.__ENV__?.[key] || (import.meta.env[key] as string) || '';
}

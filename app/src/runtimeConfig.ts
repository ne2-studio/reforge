declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

type RuntimeEnvKey =
  | 'VITE_API_URL'
  | 'VITE_OIDC_AUTHORITY'
  | 'VITE_OIDC_CLIENT_ID'
  | 'VITE_OIDC_CALLBACK_URI';

// Runtime override (window.__ENV__, set by the nginx entrypoint — see
// docker-entrypoint.d/95-generate-runtime-env.sh) wins when present and non-empty; otherwise
// falls back to the Vite build-time value. This lets one built image be pointed at a
// different API base URL / OIDC provider per environment without rebuilding — see
// public/env-config.template.js and the Dockerfile. Mirrors el-baul's src/runtimeConfig.ts.
export function getEnv(key: RuntimeEnvKey): string {
  return window.__ENV__?.[key] || (import.meta.env[key] as string) || '';
}

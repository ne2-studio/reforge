// Rendered into env-config.js by docker-entrypoint.d/95-generate-runtime-env.sh at container
// start via envsubst — never imported/executed as-is. Any ${VAR} left unset by the
// container's environment is substituted with an empty string, which src/runtimeConfig.ts
// treats as "no override" and falls back to the Vite build-time value. Mirrors el-baul's
// public/env-config.template.js.
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_OIDC_AUTHORITY: "${VITE_OIDC_AUTHORITY}",
  VITE_OIDC_CLIENT_ID: "${VITE_OIDC_CLIENT_ID}",
  VITE_OIDC_CALLBACK_URI: "${VITE_OIDC_CALLBACK_URI}",
};

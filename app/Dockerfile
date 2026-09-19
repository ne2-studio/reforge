FROM node:22-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_OIDC_AUTHORITY
ARG VITE_OIDC_CLIENT_ID
ARG VITE_OIDC_CALLBACK_URI
ENV VITE_API_URL=$VITE_API_URL \
    VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID \
    VITE_OIDC_CALLBACK_URI=$VITE_OIDC_CALLBACK_URI

RUN npm run build

FROM nginx:alpine

RUN apk upgrade --no-cache

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/ /usr/share/nginx/html/

# Renders env-config.template.js (copied above, part of dist/ via public/) into env-config.js
# at container start, so VITE_* can be overridden per-container without rebuilding — see
# src/runtimeConfig.ts for how the app reads it. The build-time ARGs above still matter: they
# back the values baked in at build time (used by native/PWA-style builds, or any deploy that
# hasn't set the runtime override), same mechanism as el-baul's app/Dockerfile.
COPY --chmod=755 docker-entrypoint.d/95-generate-runtime-env.sh /docker-entrypoint.d/

EXPOSE 80

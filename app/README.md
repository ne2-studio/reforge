# Reforge — Frontend

React 18 + TypeScript + Vite application, adapted from the `reforge-frontend` prototype (kept
Tailwind/Radix/shadcn UI kit, dropped the Supabase client entirely), talking to
[`../api`](../api) via `src/api.ts`.

## Run

### Prerequisites

- [Node.js](https://nodejs.org/) 22+

### Steps

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` needs `VITE_API_URL` (the backend's base URL), `VITE_OIDC_AUTHORITY`,
`VITE_OIDC_CLIENT_ID`, and `VITE_OIDC_CALLBACK_URI`. The committed defaults point at the
backend/fake-oidc from the root `docker-compose.yaml` running on localhost. The app is then
available at `http://localhost:5173`. You'll need the backend (and, for a full login flow,
fake-oidc) running too — see the root [`README.md`](../README.md) or
[`docs/operations/local-development.md`](../docs/operations/local-development.md).

```bash
npm run typecheck
npm run build
```

### Tests and tooling

```bash
npm run test              # Vitest unit + RTL component tests
npm run test:coverage     # same, with coverage
npm run storybook         # dev server at http://localhost:6006
npm run build-storybook   # static site, output to storybook-static/
npm run test:storybook    # executable Storybook specs, run in Chromium via @storybook/addon-vitest
```

`npm run test:acceptance` runs Playwright against the built frontend image + `Reforge.Api.Lite`
(`playwright.config.ts`, `acceptance-tests/`) — see `acceptance-tests/README.md` for the exact
build/run steps and what it covers.

## Structure

```text
src/
├── api.ts         # Single fetch client for the backend (namespaced per resource)
├── types/         # Domain entity classes, hydrated from api.ts responses
├── app/           # Base components, routes and main layout
├── features/      # Modules per domain — auth, ping (walking skeleton's one real screen)
│                  #   <domain>/routes/     — *Route.tsx container components
│                  #   <domain>/components/ — presentational only
│                  #   <domain>/useCases/   — orchestration layer (added once a feature earns it)
├── store/         # Zustand: one store per domain + uiStore (toasts/modals) — added as needed
├── design-system/ # No feature/store/API/infra deps — components/ui/* (shadcn/Radix kit)
├── legacy/        # reforge-frontend's original screens (MealLogger, WorkoutTracker, …),
│                  #   services and stores — not wired into routing yet. Kept as material for
│                  #   the vertical-slices work (docs/plan/02-vertical-slices.md), excluded
│                  #   from typecheck/lint in the meantime.
└── utils/         # Utility functions/helpers
```

See [`docs/architecture/frontend.md`](../docs/architecture/frontend.md) for the target shape
this is converging on.

## Deviations from `el-baul`'s conventions

- No Capacitor/native Android shell, no PWA plugin, no Sentry/PostHog — none of those apply to
  Reforge yet (see `docs/architecture/frontend.md`); the OIDC/runtime-config/Docker patterns
  are otherwise mirrored as closely as possible.
- `react-oidc-context`'s scope is `openid profile email` (no `offline_access` / Zitadel
  organization id) — el-baul's are workarounds for its native/mobile silent-renew edge cases,
  which don't apply to this walking skeleton.

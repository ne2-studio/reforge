# Frontend architecture (`app/`)

React + TypeScript + Vite consumer app, adapted from the `reforge-frontend` prototype. See
[`../ARCHITECTURE.md`](../ARCHITECTURE.md) for where this fits in the wider system.

This describes the target shape of `app/`, following the pattern established in the sibling
reference project `el-baul` (`app/`), adjusted for Reforge having no admin app and no Capacitor
shells.

## Layers

```
features/<domain>/routes/*Route.tsx  →  features/<domain>/useCases/*  →  store/*  →  api.ts  →  types/index.ts
                    ↓ renders                    ↑ orchestrates
        features/<domain>/components/*.tsx  (store actions, api.*, other stores/use cases)
        (presentational screens/modals — zero router/store/useCases imports)
                    ↓ composed from
        design-system/{foundations,components,patterns,layouts}/*.tsx
```

- **`types/index.ts`** — one class per domain entity (user profile, meal, meal-library entry,
  workout, activity, measurement, reminder, day close), so raw JSON can be re-hydrated via
  `new Entity(data)`.
- **`api.ts`** — a single `api` object, namespaced per resource. Plain `fetch` through a shared
  `handleResponse` that throws on non-OK responses; auth token is module-level state set via
  `setAccessToken()` from the OIDC auth context. Every response is mapped back into its
  `types/index.ts` class.
- **`store/`** — not a single store; state is split by domain (Zustand, one store per area), plus
  a cross-cutting `uiStore.ts` for toast/modal state that isn't server data. Stores hold state,
  `reset()`, and their own actions until a feature earns extracting them into `useCases/`. Sign-out
  resets every domain store from one place, not per-store.
- **`features/<domain>/useCases/index.ts`** — a use case is a plain async function that
  orchestrates one action end to end: it calls `api.*`, writes the result into a store via
  `useXStore.setState()`, and may call other stores/use cases when an action has cross-domain
  side effects. One module per feature, not one file per use case, split into multiple files only
  once it earns it.
- **`features/<domain>/routes/*Route.tsx`** — one container component per route, one module per
  feature (peer of `useCases/`, `components/`). A Route component reads `useParams`/store state
  directly, defines handlers that call `useCases/` functions for anything mutating (navigation
  and toasts stay in the Route), and renders a presentational component from the same feature's
  `components/` folder, with everything passed as props. `components/` is strictly
  presentational: no `react-router-dom`, `store/`, or `useCases/` imports there — those belong in
  `routes/`. Enforced by ESLint (a `componentBoundaryRule`, scoped to `features/*/components/**`),
  not just convention — a presentational component that needs to trigger a toast, navigate, or
  read a store takes a prop callback from its Route instead.
  - **Exception**: a Route may call `api.*` directly, bypassing `store/`/`useCases/`, when the
    result is never cached or shared across routes — there's no state a store would own (e.g. a
    one-off blob download). If a second call site needs the same data, or the data must survive
    navigation, move it to a store instead of adding a second direct caller.
- **`design-system/`** — no dependency on concrete feature implementations: feature components,
  feature hooks, routes, stores, API clients, or other application-state infrastructure. It may
  depend on small shared product value types when they're a natural part of a component's
  contract and don't couple it to one concrete feature.
- **`App.tsx`** — owns routing (`react-router-dom`, no shared `<Layout>` wrapper — each route
  renders its own screen), the auth redirect gate, and one-time domain data load on auth change.
  Every protected route is wrapped in `<ProtectedRoute>`/`<PublicRoute>`, not a layout component.
- **`main.tsx`** — entry point: `<AuthProvider>` (OIDC config) and `<BrowserRouter>`.

## Conventions

- **Auth**: `react-oidc-context`. There's no mock/demo login — the app always redirects to the
  configured OIDC provider's `/authorize` endpoint (`fake-oidc` locally, Zitadel in production)
  and only becomes authenticated once that flow completes. `App.tsx` redirects to sign-in
  whenever the user isn't authenticated and isn't on a public path; the access token is pushed
  into `api.ts` on every auth state change.
- **Routing**: all routes declared flat in `App.tsx`, in Spanish where they name domain concepts
  (e.g. `/comidas`, `/entrenamientos`) — the domain language is the URL language too. This is
  frontend-only: the backend's own API routes are English, so the two surfaces don't share a
  vocabulary.
- **State management**: Zustand only, split by concern as above — no React Context for domain
  data, no server-state library (React Query, SWR).
- **Styling**: Tailwind CSS, kept from the `reforge-frontend` prototype (Tailwind/Radix/shadcn UI
  kit) — the Supabase client is dropped entirely, the UI kit is not.
- **TypeScript**: a `@/*` path alias maps to `app/src`.
- **Linting**: ESLint (flat config) — `typescript-eslint` recommended, `react-hooks`, plus a
  `components/` import-boundary rule once the feature/component split above is in place. Run via
  `npm run lint`, part of `./scripts/verify frontend` once that script exists.
- **No shared package/types** between frontend and backend — DTO shapes are kept in sync by hand.
  See [`../API-CONVENTIONS.md`](../API-CONVENTIONS.md#contract-changes).

## Testing pyramid

Mirrors `el-baul`'s approach — choose the smallest test that can detect the failure:

- **Unit** (Vitest, `environment: 'node'`) — narrow, in-process, no DOM: store logic, utils.
- **Component** (Vitest + jsdom + React Testing Library) — components/hooks needing a real DOM.
  Query priority: role/label/placeholder/text before `data-testid`.
- **Storybook executable specs** (`@storybook/addon-vitest`, run in Playwright Chromium browser
  mode) — every eligible story must render; stories with `play` functions also execute their
  interaction assertions. Run as part of `./scripts/verify frontend`.
- **`app/acceptance-tests/`** — Playwright against the built frontend image + `Reforge.Api.Lite`
  (see [`../operations/api-lite.md`](../operations/api-lite.md)), no real Postgres to boot. Run
  via `./scripts/verify frontend-acceptance`.

## Structure

```text
src/
├── api.ts         # Single fetch client for the backend (namespaced per resource)
├── types/         # Domain entity classes, hydrated from api.ts responses
├── app/           # Base components, routes and main layout
├── features/      # Modules per domain (auth, profile, meals, workouts, activities,
│                  #   measurements, reminders, day-close, …)
│                  #   <domain>/routes/     — *Route.tsx container components (one per URL)
│                  #   <domain>/components/ — presentational only: no router/store/useCases imports
│                  #   <domain>/useCases/   — orchestration layer: api.* + store writes
├── store/         # Zustand: one store per domain + uiStore (toasts/modals)
├── design-system/ # No feature/store/API/infra deps; small product value types OK
└── utils/         # Utility functions/helpers
```

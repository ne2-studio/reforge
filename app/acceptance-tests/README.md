# Acceptance tests

Playwright suite that verifies the **built frontend image** against **`Reforge.Api.Lite`** plus
a `fake-oidc` container — the artifact, not a rebuild from source. Mirrors
`el-baul/app/acceptance-tests`, scoped down to the walking skeleton's one real screen: OIDC
login followed by an authenticated `GET /ping` call.

See [`../../docs/operations/api-lite.md`](../../docs/operations/api-lite.md) for why
`Reforge.Api.Lite` exists, and [`../../docker-compose.lite.yml`](../../docker-compose.lite.yml)
for the exact stack (`fake-oidc` on `:5000`, `api-lite` on `:5051`, `app` on `:3000`).

## Running

```bash
# from the repo root
docker build -t reforge-app:local app/
docker build -f api/Reforge.Api.Lite/Dockerfile -t reforge-api-lite:local api/

cd app
npx playwright install chromium
npm run test:acceptance
```

`APP_IMAGE`/`API_LITE_IMAGE` env vars override the image tags `docker-compose.lite.yml` uses
(default `reforge-app:local` / `reforge-api-lite:local`). `./scripts/verify frontend-acceptance`
builds the images and runs this exact suite in one step — that's what CI runs.

## Structure

- `global-setup.ts` / `global-teardown.ts` — bring `docker-compose.lite.yml` up before the run
  (no `--build`: the images are supplied from outside) and down after, waiting for
  `api-lite`'s `/health`, the `app` container, and fake-oidc's JWKS endpoint to respond before
  handing off to the specs.
- `helpers.ts` — `loginAs(page, userButtonName)`: drives the real OIDC redirect flow through
  fake-oidc's user-selection screen (`'Reforge User'` / `'Reforge User 2'`, see
  `docker-compose.lite.yml`'s `OIDC_USERS`) and returns the access token
  `react-oidc-context` persists to `localStorage`.
- `login.spec.ts` — logs in as `'Reforge User'`, lands on `/ping`, and asserts the synced user
  id (`reforge-user`) is shown with no console errors or failed (`>= 400`) network requests.

There's no baúl/persona/photo domain yet (this is `el-baul`'s architecture, not its feature
set) — as vertical slices land (`docs/plan/02-vertical-slices.md`), new specs and API-seeding
helpers get added here the same way `el-baul/app/acceptance-tests/helpers.ts` grew one
`createXViaApi` at a time.

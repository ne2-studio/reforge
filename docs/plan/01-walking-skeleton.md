# Walking skeleton

Purpose: prove every seam of the toolchain with near-zero product logic, so
every later slice is pure domain work on top of an already-verified
pipeline. Acceptance for the skeleton is **tooling working end to end**, not
feature completeness.

## Scope

- Repo scaffolding: root `README.md`, `CLAUDE.md`/`AGENTS.md`, `docs/`
  skeleton (`ARCHITECTURE.md`, `API-CONVENTIONS.md`, `architecture/backend.md`,
  `architecture/frontend.md`, `operations/local-development.md`,
  `operations/api-lite.md`), `.claude/skills/{run,verify,update-changelog}`
  adapted from el-baul, `CHANGELOG.md`.
- `api/`: .NET solution with ports-and-adapters skeleton —
  `Reforge.Core` (empty feature folder + `Result`/`ApplicationError`
  vocabulary), `Reforge.Infra.Common`, `Reforge.Infra.Lite` (in-memory
  adapters), `Reforge.Api.Common`, `Reforge.Api` (real image, Postgres via
  EF Core), `Reforge.Api.Lite` (lite image, in-memory adapters, same HTTP
  pipeline). One real vertical: `GET /health` (anonymous) and
  `GET /profile/ping` (or similar) behind JWT-bearer auth, backed by a
  trivial `Users` sync-on-first-request table, to prove OIDC + EF Core +
  migrations actually work, not just compile.
- OIDC wired against `fake-oidc` locally (docker-compose), Zitadel
  configuration slot present for production (`Auth:JwksUri`,
  `Auth:ValidIssuer`, `Auth:ValidAudiences`).
- `app/`: Vite/React app adapted from `reforge-frontend`'s scaffolding
  (keep Tailwind/Radix/shadcn UI kit, drop Supabase client entirely),
  `react-oidc-context` wired against fake-oidc, one screen that logs in and
  calls the authenticated ping endpoint.
- Test layers, all green with trivial content, proving the pipeline:
  - `api`: `Reforge.Core.Tests` (unit), `Reforge.Infra.PersistenceTests`
    (one real Testcontainers Postgres test), `Reforge.Api.Tests` (auth
    policy test + OpenAPI snapshot generation), `api/acceptance-tests`
    (black-box against the built `Reforge.Api` image: smoke + one
    authenticated round trip via fake-oidc container), `ArchitectureTests`
    (ArchUnitNET layering rules) wired even though there's only one
    feature.
  - `app`: one Vitest unit test, one RTL component test, Storybook set up
    with at least one real story + `addon-vitest` wired into `verify
    frontend`, `app/acceptance-tests` Playwright test against the built
    app image + `Reforge.Api.Lite` image (login via fake-oidc, see ping
    result).
- `scripts/run-env`, `scripts/verify`, `scripts/openapi`,
  `scripts/fake-oidc-token`, `docker-compose.yaml`,
  `docker-compose.lite.yml` — adapted from el-baul, renamed for Reforge.
- `.github/workflows/backend-cicd.yml`, `frontend-cicd.yml`,
  `storybook-cicd.yml` — path-filtered, image-gated, mirroring el-baul's
  stage structure. No deploy target configured yet (deploy step present
  but pointed at a placeholder/disabled until infra exists) — confirm with
  user before wiring a real Coolify/GHCR target.

## Acceptance criteria

- `./scripts/run-env full-stack` brings up Postgres + fake-oidc + api +
  app locally; logging in as a fake-oidc test user and hitting the
  authenticated ping screen works.
- `./scripts/verify all` passes: backend unit, backend-persistence,
  backend-acceptance (against built image), frontend (unit + RTL +
  Storybook), frontend-acceptance (Playwright against built image +
  api-lite image).
- Architecture test suite runs (even trivially) and CI pipelines are green
  on a throwaway branch/PR.

## Explicit non-goals for this slice

No real domain data beyond a minimal `Users` sync row. No profile CRUD, no
meals, no AI, no Stripe. Those are the vertical slices that follow.

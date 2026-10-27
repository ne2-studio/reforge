# Reforge

A fitness and nutrition coaching app — track meals, workouts, activities and
measurements, close each day's log, and keep a streak going.

## Philosophy

- Long-term maintainability over clever code.
- Clear, documented architecture.
- Independent deployability per service.
- No product logic until the toolchain (auth, persistence, CI, every test
  layer) is proven end to end — see the walking-skeleton plan in
  [`docs/plan/01-walking-skeleton.md`](docs/plan/01-walking-skeleton.md).

## Repository layout

```text
app/            React + TypeScript + Vite frontend
api/            .NET backend, ports & adapters
storybook/      Storybook image for app/ components
web/            Hugo landing page
docs/           Architecture standard, API conventions, plan
scripts/        run-env, verify, openapi and related helpers
.claude/skills/ run, verify, update-changelog
```

Monorepo, independently deployable services, no shared code between
them. Authentication uses an external OIDC provider (`fake-oidc` locally,
Zitadel in production).

## Quick start

### Prerequisites

- Node.js 22+
- .NET 10 SDK
- Docker

`docker-compose.yaml` and `scripts/run-env` bring up the full local stack
(Postgres, fake-oidc, `api`, `app`) with one command. They are being added
by a follow-up piece of work; once in place, see
[`docs/operations/local-development.md`](docs/operations/local-development.md)
for the exact modes and URLs. Until then, run each project directly — see
`api/README.md` and `app/README.md` once they exist.

## Verification

Canonical verification runs from the repository root through
`scripts/verify`, once that script lands (see
[`docs/architecture/backend.md`](docs/architecture/backend.md) and
[`docs/architecture/frontend.md`](docs/architecture/frontend.md) for what
each test layer covers):

```bash
./scripts/verify backend
./scripts/verify backend-persistence
./scripts/verify backend-acceptance
./scripts/verify frontend
./scripts/verify frontend-acceptance
./scripts/verify all
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — entry point to the architecture docs, routes to the rest
- [`docs/API-CONVENTIONS.md`](docs/API-CONVENTIONS.md) — auth, error and authorization rules not visible in the OpenAPI schema
- [`docs/architecture/backend.md`](docs/architecture/backend.md) — backend (`api/`) architecture
- [`docs/architecture/frontend.md`](docs/architecture/frontend.md) — frontend (`app/`) architecture
- [`docs/operations/local-development.md`](docs/operations/local-development.md) — running the stack locally
- [`docs/operations/api-lite.md`](docs/operations/api-lite.md) — the in-memory backend image used for frontend tests
- [`docs/plan/`](docs/plan/) — the incremental implementation plan for this monorepo

## Deployment

Each service has its own workflow in `.github/workflows/` (`backend-cicd`, `frontend-cicd`,
`storybook-cicd`, `web-cicd`). A push to `main` builds and tests it, releases its image to
`ghcr.io/ne2-studio/reforge-<service>`, and triggers its Coolify webhook through
`scripts/deploy`.

| Service   | Image                                    | URL                                   |
| --------- | ---------------------------------------- | ------------------------------------- |
| backend   | `ghcr.io/ne2-studio/reforge-api`         | https://api-prod.reforge.ne2.studio   |
| frontend  | `ghcr.io/ne2-studio/reforge-app`         | https://app-prod.reforge.ne2.studio   |
| storybook | `ghcr.io/ne2-studio/reforge-storybook`   | https://storybook.reforge.ne2.studio  |
| web       | `ghcr.io/ne2-studio/reforge-web`         | https://reforge.ne2.studio            |

Coolify apps, their environment variables, the Postgres database, the Zitadel org and the
GitHub Actions variables/secrets (`COOLIFY_WEBHOOK_*` per environment, `COOLIFY_API_TOKEN`)
are managed as code in `ne2-studio/infra` (`modules/reforge`).

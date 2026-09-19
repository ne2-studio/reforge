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
docs/           Architecture standard, API conventions, plan
scripts/        run-env, verify, openapi and related helpers
.claude/skills/ run, verify, update-changelog
```

Monorepo, two independently deployable services, no shared code between
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

Not configured yet — deployment automation will follow once
`.github/workflows/` and the target infrastructure exist.

# Local development

This document describes the target contract for `scripts/run-env` and `docker-compose.yaml`,
which are added by a follow-up piece of work (see
[`../plan/01-walking-skeleton.md`](../plan/01-walking-skeleton.md)). It mirrors `el-baul`'s
`run-env` modes, scoped to Reforge's two projects (no admin app, no MinIO/imgproxy — neither is
needed yet).

## Modes

`./scripts/run-env <mode>` is expected to support three modes:

| Mode | Use when | Frontend | Backend | Docker components | Dev components |
|---|---|---|---|---|---|
| `frontend-dev` | Inspecting or changing the consumer app UI | `http://localhost:5173` | `http://localhost:5051` | `fake-oidc`, `api-lite` | Vite app server |
| `backend-dev` | Inspecting or changing the real API with fast local recompilation and real infrastructure | none | `http://localhost:5050` | Postgres, `fake-oidc` | `dotnet run` API |
| `full-stack` | Production-like wiring, containers, or infrastructure inspection | `http://localhost:3000` | `http://localhost:5050` | Postgres, `fake-oidc`, API, app | none |

`frontend-dev` deliberately uses `reforge-api-lite`, not the real backend, so UI work has a stable
in-memory backend and Vite hot reload. It must not leave a Docker frontend serving on `3000`, and
does not reproduce real persistence, storage, or built-image behavior.

## Port contract

- Consumer app Vite dev: `http://localhost:5173`
- Consumer app Docker image: `http://localhost:3000`
- Real backend: `http://localhost:5050`
- Lite backend: `http://localhost:5051`
- fake-oidc: `http://localhost:5000`
- Postgres: `localhost:5432`

Ports are fixed. The helper must fail on ambiguous conflicts instead of silently switching ports.

Starting a mode must leave only the requested repository-owned environment active. The helper may
reconcile processes and compose stacks it owns from a previous mode, but must not stop unrelated
user processes.

## Everything via Docker Compose (target)

```bash
docker compose up --build
```

Brings up Postgres, fake-oidc, the API, and the frontend together, each built from its own
Dockerfile. fake-oidc is a throwaway OIDC provider for local/E2E use — there's no login UI, users
are selected via `login_hint`.

## Backend only, against host-run dependencies (target)

```bash
docker compose up postgres fake-oidc
```

```bash
cd api
dotnet run --project Reforge.Api
```

The API is then available at `http://localhost:5050`, expecting fake-oidc at
`http://localhost:5000` (see `appsettings.json`'s `Auth` section). Migrations are applied
automatically at startup.

## Frontend only (target)

```bash
cd app
cp .env.example .env
npm install
npm run dev
```

The Vite dev server runs at the stable URL `http://localhost:5173`. If that port is already
occupied, startup fails instead of switching ports. You'll need the backend (and, for a full login
flow, fake-oidc) running too — or point it at `reforge-api-lite` for a fast, deterministic
backend (see [`api-lite.md`](api-lite.md)).

Use `http://localhost:3000` only when you intentionally want the precompiled frontend image
served by Docker. Routine local frontend iteration should use `http://localhost:5173`.

## Identity

Local auth uses the repository's fake-oidc provider. Test identities are whatever
`OIDC_USERS` in `docker-compose.yaml` defines once it exists — do not invent credentials.

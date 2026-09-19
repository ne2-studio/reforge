# Reforge — Backend

ASP.NET Core (.NET 10) backend for Reforge. Ports & adapters, mirroring the pattern
established in the sibling reference project `el-baul` — see
[`../docs/architecture/backend.md`](../docs/architecture/backend.md) for the target shape and
dependency rules.

This is the walking skeleton cut (see
[`../docs/plan/01-walking-skeleton.md`](../docs/plan/01-walking-skeleton.md)): near-zero
product logic, just enough to prove the toolchain — `GET /health` (anonymous) and an
authenticated `GET /api/ping` backed by a sync-on-first-request `Users` table.

## Run

The public surface is two independently built Docker images — nothing else in this directory
is meant to be run standalone.

### `reforge-api` (real backend, Postgres via EF Core)

```bash
docker build -f Reforge.Api/Dockerfile -t reforge-api .
docker run -p 5050:8080 \
  -e ConnectionStrings__DefaultConnection="Host=<postgres-host>;Port=5432;Database=reforge;Username=<user>;Password=<pass>" \
  -e Auth__JwksUri="<oidc-issuer>/.well-known/jwks.json" \
  -e Auth__ValidIssuer="<oidc-issuer>" \
  -e Auth__ValidAudiences__0="reforge-app" \
  reforge-api
```

That's the minimum for the container to start and serve traffic — migrations run
automatically at startup. `appsettings.json`/`appsettings.Development.json` are the source of
truth for local defaults; every setting is overridable via `Section__Key` env vars.

Without building the image, against a host-run Postgres:

```bash
docker compose up postgres fake-oidc   # once docker-compose.yaml exists — see docs/plan
dotnet run --project Reforge.Api
```

### `reforge-api-lite` (in-memory backend, for frontend/E2E testing)

```bash
docker build -f Reforge.Api.Lite/Dockerfile -t reforge-api-lite .
docker run -p 5051:8080 \
  -e Auth__JwksUri="<oidc-issuer>/.well-known/jwks.json" \
  -e Auth__ValidIssuer="<oidc-issuer>" \
  -e Auth__ValidAudiences__0="reforge-app" \
  reforge-api-lite
```

No Postgres needed — everything lives in memory for the container's process lifetime.

## Tests

```bash
dotnet test Reforge.Api.slnx
```

Projects in the solution today:

- `Reforge.Core.Tests` — unit tests for `Reforge.Core` (fake-first), plus `ArchitectureTests`
  (ArchUnitNET) enforcing the InputPorts/OutputPorts/Application layering rules from
  [`../docs/architecture/backend.md`](../docs/architecture/backend.md).

Not yet added (follow-up task, per the testing pyramid in
[`../docs/architecture/backend.md`](../docs/architecture/backend.md#testing-pyramid)):
`Reforge.Infra.PersistenceTests` (Testcontainers Postgres), `Reforge.Api.Tests` (auth policy +
OpenAPI snapshot), and `api/acceptance-tests` (black-box against the built image).

## API routes

Routes and request/response shapes are generated OpenAPI, not documented here. Run the stack
and open `http://localhost:5050/swagger` (Development only), or fetch
`http://localhost:5050/swagger/v1/swagger.json` directly. Semantic rules that don't show up in
a generated schema (authorization, error codes) are in
[`../docs/API-CONVENTIONS.md`](../docs/API-CONVENTIONS.md).

## Structure

```
Reforge.Core         — domain core, organized by feature (input ports + DTOs, Application/ use cases, OutputPorts/)
Reforge.Api          — HTTP entry point for reforge-api: real infra registration + Program.cs
Reforge.Api.Lite     — HTTP entry point for reforge-api-lite: in-memory infra + Program.cs
Reforge.Api.Common   — shared with both: controllers, JWT validation, CORS, manager DI, middleware pipeline
Reforge.Infra        — real adapters (EF Core repositories over Postgres)
Reforge.Infra.Lite   — in-memory adapters (backs reforge-api-lite)
Reforge.Infra.Common — shared with both: clock, current-user provider, user-sync middleware
Reforge.Core.Tests   — unit tests + ArchitectureTests (ArchUnitNET)
```

See [`../docs/architecture/backend.md`](../docs/architecture/backend.md) for dependency rules
and conventions.

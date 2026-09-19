# Backend architecture (`api/`)

.NET (ports & adapters). See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) for where this fits in
the wider system and [`../API-CONVENTIONS.md`](../API-CONVENTIONS.md) for API-surface semantics.

This describes the target shape of `api/`, mirroring the pattern established in the sibling
reference project `el-baul` (`ElBaul.*` projects). The project names below (`Reforge.*`) are the
ones the backend scaffold is expected to use once it's built — this doc doesn't require the code
to exist yet.

## Project dependency rules

The backend builds into **two independent Docker images** — `reforge-api` (real infra) and
`reforge-api-lite` (everything in memory, for frontend/Playwright testing — see
[`../operations/api-lite.md`](../operations/api-lite.md)). They are never the same image behind
an `ASPNETCORE_ENVIRONMENT` switch; everything that must stay identical between them (the HTTP
pipeline, auth, the manager DI graph) lives in shared projects both hosts reference, so the two
images can't silently diverge on anything but which adapter backs each port:

```
Reforge.Api ──────┐                          Reforge.Api.Lite ──────┐
                  ├──→  Reforge.Api.Common  ──┤                     │
Reforge.Infra ────┤            │             ├──→  Reforge.Infra.Lite┤
                  ├──→  Reforge.Infra.Common ─┴─────────────────────┤
                  ┘                                                 │
                                                                     ↓
                                                      Reforge.Core (core: Application + Ports)
```

- **`Reforge.Core`** — domain/use-case core, organized by feature. Each feature folder holds its
  use-case (input port) interfaces + DTOs at its root, `Application/` (one manager class per
  aggregate root, implementing its input port), and `OutputPorts/` (everything that feature needs
  from the outside world — repositories, `IClock`, `IIdGenerator`, `ICurrentUserProvider`, etc.;
  cross-feature ones live in a shared `Shared/OutputPorts/`). Every fallible operation — use cases
  and output ports alike — returns `Shared.Result`/`Result<T>`, the one outcome vocabulary for the
  whole core. References only `Microsoft.Extensions.Logging.Abstractions` — **no ASP.NET Core, no
  DB driver, no ORM.** Fully unit-testable in isolation. In the walking skeleton this holds a
  single, near-empty feature to prove the shape, not a full domain model.
- **`Reforge.Api` / `Reforge.Api.Lite`** — thin `Program.cs` per image: register that image's own
  infrastructure, call the shared host bootstrap, then handle whatever's genuinely
  infra-specific (migrations for the real image; nothing extra for Lite).
- **`Reforge.Api.Common`** — everything about the HTTP host that doesn't depend on which
  infrastructure is behind it: controllers, request DTOs, error mapping, JWT auth setup, CORS,
  the manager DI registrations, the middleware pipeline. Controllers depend only on input-port
  interfaces (`Reforge.Core`'s per-feature manager interfaces), never on
  `Infra`/`Infra.Lite` or `Application` concrete types.
- **`Reforge.Infra` / `Reforge.Infra.Lite`** — implement every output port with real adapters (EF
  Core repositories over Postgres) or in-memory ones, respectively. `Reforge.Infra.Lite` never
  references `Reforge.Infra` — no Npgsql dependency at all. Each exposes its own
  composition-root method (`AddInfrastructure()`/`AddLiteInfrastructure()`).
- **`Reforge.Infra.Common`** — the output-port implementations that don't depend on Postgres and
  so are identical in both images (clock, id generator, current-user provider, user-sync
  middleware, OIDC userinfo client). Referenced by both Infra projects.

`api/acceptance-tests/` is a deliberately separate solution testing the *built image* — see the
testing pyramid below.

### `Reforge.Core`'s feature boundaries

Following `el-baul`'s convention, `Reforge.Core`'s internal shape is guarded by an
**`ArchitectureTests`** project (ArchUnitNET) enforcing the InputPorts/OutputPorts/Application
layering *within* each feature — e.g. OutputPorts must never depend on InputPorts. This is wired
even in the walking skeleton, when there's only one feature to check, so the rule is already in
place before the domain grows.

## Controllers

Controllers are thin HTTP adapters: one per resource area, each handler delegates to an input
port method and maps the `Result`/`Result<T>` to an HTTP response. They must not contain domain
logic or depend directly on infrastructure. Every endpoint is `[Authorize]` by default except the
few explicitly anonymous ones documented in [`../API-CONVENTIONS.md`](../API-CONVENTIONS.md). The
caller's identity is never a controller parameter — use cases call `ICurrentUserProvider.GetUserId()`
themselves.

**Error mapping**: an `ErrorMapping.ToActionResult` helper (`Reforge.Api.Common`) maps an
input-port `Result`/`Result<T>` failure's `ApplicationError.Code` to a status code. The observable
body remains `{ "error": "..." }`, but the status doesn't depend on the message text:
`Validation` → 400, `Forbidden` → 403, `NotFound` → 404. See
[`../API-CONVENTIONS.md`](../API-CONVENTIONS.md) for the resulting observable semantics.

## Auth

- `JwtBearer` validates access tokens. Signing keys are fetched directly from a configured
  `Auth:JwksUri` and cached in-process, **not** resolved from the token issuer's discovery
  document, because in Docker the backend and the browser often can't reach the OIDC provider
  under the same hostname (e.g. `fake-oidc:5000` internally vs `localhost:5000` from the browser)
  — `Auth:JwksUri` (backend-reachable) and `Auth:ValidIssuer` (browser/token-`iss` address) are
  configured independently instead of letting the library auto-discover. `Auth:ValidAudiences`
  rounds out the configuration slot for production (Zitadel); locally it points at `fake-oidc`.
- A `UserSyncMiddleware` (`Reforge.Infra.Common`, shared with `reforge-api-lite`) just-in-time
  syncs a local `Users` row for the authenticated `sub` claim, since OIDC access tokens only carry
  `sub`. This is the walking skeleton's one real vertical: `GET /health` (anonymous) and an
  authenticated ping endpoint backed by that sync-on-first-request `Users` table, proving OIDC +
  EF Core + migrations actually work end to end, not just compile.
- `Application/` use-case code never reads `HttpContext`/claims directly — `UserSyncMiddleware`
  and an `HttpContextCurrentUserProvider` are the only places that do.

## Core conventions

- **Every external effect sits behind an output port** (`IClock`, `IIdGenerator`,
  `ICurrentUserProvider`, …) — this is what makes `Application/` managers unit-testable with
  hand-written fakes by default and small NSubstitute stubs where a test only needs one
  collaborator method or one injected failure.
- **DI lifetimes are `Scoped` by default.**
- No decorator or null-object patterns are in use — infra concerns compose behavior directly
  rather than through a wrapping layer.

## Data access

- **EF Core** over PostgreSQL. Table/column mapping via Fluent API (`EntityConfigurations/`), not
  data annotations.
- Migrations apply automatically at startup (`dbContext.Database.MigrateAsync()`), never a manual
  deploy step.
- **IDs**: `Guid` primary keys for domain entities; `User` is keyed by the OIDC `sub` claim
  instead (opaque `text` — OIDC subject ids aren't guaranteed GUID-shaped).
- **Timestamps**: `CreatedAt`/`UpdatedAt` set via `IClock` (UTC), not DB defaults.

## Testing pyramid

Mirrors `el-baul`'s approach — choose the smallest test that can detect the failure:

| Level | Project | Covers |
|---|---|---|
| Unit | `Reforge.Core.Tests` | Application/domain logic, fake-first (hand-written fakes for stateful ports, NSubstitute for narrow seams) |
| Persistence | `Reforge.Infra.PersistenceTests` | EF repository/adapter behavior only a real Postgres can catch (query translation, FK ordering) — Testcontainers, excluded from the main solution since it needs a running Docker daemon |
| API | `Reforge.Api.Tests` | Auth policy tests, OpenAPI snapshot generation — concerns that need the ASP.NET pipeline itself |
| Architecture | `ArchitectureTests` (ArchUnitNET) | InputPorts/OutputPorts/Application layering within `Reforge.Core` |
| Acceptance (image) | `api/acceptance-tests` | Black-box against the *built* `Reforge.Api` Docker image: smoke check + one authenticated round trip via a real `fake-oidc` container. A separate solution, no `ProjectReference` to anything above. |

Run via `./scripts/verify backend`, `backend-persistence`, `backend-acceptance` (see
[`../operations/local-development.md`](../operations/local-development.md) once `scripts/verify`
exists).

## Other conventions

- **Logging**: Serilog, console sink, request logging via `UseSerilogRequestLogging()`.
- **API docs**: Swagger/Swashbuckle, enabled only in `Development`.
- **CORS**: `AllowAnyOrigin`/`AllowAnyMethod`/`AllowAnyHeader` — acceptable since auth is bearer
  token, not cookies/origin-based.
- **Config**: `appsettings.json` (dev defaults committed) + `appsettings.Production.json` +
  environment variables in the container. Never commit production secrets.

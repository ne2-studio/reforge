# reforge-api-lite (in-memory image for frontend testing)

This describes the target shape of `Reforge.Api.Lite`, which is added alongside the rest of the
backend scaffold (see [`../plan/01-walking-skeleton.md`](../plan/01-walking-skeleton.md)). It
mirrors `el-baul`'s `el-baul-api-lite` image.

A second, independently built Docker image — `Reforge.Api.Lite/Dockerfile` — runs the same API
surface as `reforge-api` but with every output port backed by an in-memory adapter instead of
Postgres. It exists so Playwright/frontend work can run against a fast, deterministic, disposable
backend instead of the full compose stack. See [`../architecture/frontend.md`](../architecture/frontend.md)
for how `app/acceptance-tests/` uses it.

It is a **separate image**, not a flag: there's no `ASPNETCORE_ENVIRONMENT`-style switch that
turns `reforge-api` into this. `Reforge.Api.Common`/`Reforge.Infra.Common` hold everything that
must stay identical between the two (auth, CORS, controllers, the manager DI graph, user-sync
logic) precisely so the HTTP pipeline and auth/user-sync logic can never silently diverge between
images — only the project graph differs:

```
Reforge.Api.Lite ──┐
                   ├──→  Reforge.Api.Common  ──┐
                   │                           ├──→  Reforge.Infra.Common  ──→  Reforge.Core
                   └──→  Reforge.Infra.Lite  ──┘
```

| Port | Real (`reforge-api`) | Lite (`reforge-api-lite`) |
|---|---|---|
| Repositories (`I*Repository`) | EF Core / Postgres | `InMemory*Repository` — the exact classes `Reforge.Core.Tests` uses, singleton-scoped so a run's data survives across requests |
| `IClock`, `IIdGenerator`, `ICurrentUserProvider`, `IUserInfoClient` | Real implementations | The **same** real implementations (`Reforge.Infra.Common`) — these don't touch Postgres, so there's nothing to fake |
| Auth (JWT/OIDC) | fake-oidc / Zitadel | Unchanged — still needs a real fake-oidc container to mint tokens against |

Everything lives in memory for the container's process lifetime — a container restart is the only
way to reset state; there is no `/test/reset` endpoint.

This image is **not** exercised by `api/acceptance-tests/` and shouldn't be — that suite exists
specifically to verify the real image against real infrastructure. `app/acceptance-tests/` running
successfully in CI is the closest thing to an automated check that `reforge-api-lite` still
builds/works on its own.

No file storage, background jobs, or third-party integrations exist in the walking skeleton, so
there's nothing else to fake yet — this table grows as those land.

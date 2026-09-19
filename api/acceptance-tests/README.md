# Reforge backend — Docker image acceptance tests

Black-box acceptance tests for the **built backend Docker image**, not the backend source code.
The subject under test is the artifact — the same image that gets pushed/deployed — imagined as
if it had been built by an external provider handed nothing but the image, its
environment-variable contract, and its public HTTP API.

This is deliberately a separate project from the rest of `api/` (its own directory, its own
`.slnx`, no shared solution) so it cannot accidentally acquire a dependency on backend source.

## Rules

These are not guidelines, they're enforced (either by `ArchitectureRulesTests.cs`, which runs on
every `dotnet test`, or structurally, by what this project simply has no way to do):

- **No `ProjectReference` to anything under `api/Reforge*/`.** Checked by
  `ArchitectureRulesTests.This_project_has_no_ProjectReference_to_anything`, which reads this
  project's own `.csproj` and fails if one appears — a change here (rather than a silent merge)
  is what a reviewer should see if this rule is ever violated.
- **No shared fixtures, no reused internal DTOs.** Response shapes are asserted via
  `JsonDocument`, never by referencing `Reforge.Core`'s `PingResponseDto` or any other backend
  type. A wire-format regression the backend's own tests wouldn't catch (because they'd
  recompile against the same, now-broken, shared type) is exactly the kind of bug this project
  exists to catch.
- **No direct database access.** Nothing here connects to Postgres directly — migrations having
  run is proven indirectly, by the ping journey round-tripping through a freshly-synced `Users`
  row.
- **The image is always supplied from outside**, via the `BACKEND_IMAGE` environment variable
  (see `ReforgeAcceptanceFixture.InitializeAsync`) — never built from source as part of running
  these tests. That's what makes the subject under test unambiguously the artifact, not the code.
- **No `WebApplicationFactory`.** The backend only ever exists here as a real container, reached
  over the network like any other client would reach it.
- **No calling backend classes, handlers, or repositories directly**, and **no replacing
  services via DI.** There is no DI container in this project pointed at the backend — there's
  an `HttpClient`.
- **External dependencies are real containers** (Postgres, `ghcr.io/ne2-studio/fake-oidc`) on an
  isolated Testcontainers network, configured the same way an operator would — public images,
  env vars, ports — never fakes wired in-process.
- **Assertions are on observable behavior only**: HTTP status codes, response bodies, container
  state/exit codes. Nothing here can see inside the process.

## What's covered — and, as importantly, what isn't

Two groups, in `Smoke/` and `CriticalJourneys/`:

- **Smoke** — does the image start, stay up, answer `/health`, actually listen on its published
  port, and fail fast and diagnosably (non-zero exit, non-empty logs — not a silent hang) when a
  required external dependency (Postgres) is unreachable. Reforge has no env-var-driven
  observable config endpoint yet (unlike el-baul's `/api/app-config`), so that one specific check
  is skipped rather than inventing a new production endpoint just to satisfy this suite — see the
  comment on `SmokeTests`.
- **Critical journeys** — deliberately narrow: one full journey (get a real token from
  fake-oidc → call the one authenticated endpoint, `GET /api/ping` → confirm the response
  reflects the token's own `sub`) plus one boundary check (an unauthenticated request to a
  protected endpoint is rejected). This is not a second copy of the backend's own domain test
  suite — `Reforge.Core.Tests` already covers `PingManager`'s logic far more cheaply against a
  hand-written fake. This only proves the image's public wire contract still works end to end.

No MinIO/`InfrastructureCompatibility` group: Reforge has no object storage yet (see
`docs/architecture/backend.md`), and a direct Postgres migration check was judged not worth the
extra `psql`-in-container plumbing while the ping journey already proves migrations ran
end-to-end (a fresh `Users` row can only be written if `CREATE TABLE "Users"` already ran).

## Running locally

From the repository root:

```bash
docker build -f api/Reforge.Api/Dockerfile -t reforge-api:test api/
BACKEND_IMAGE=reforge-api:test ./scripts/verify backend-acceptance
```

Requires a running Docker daemon reachable from the test process (Testcontainers talks to it
directly — no extra configuration needed on a normal local Docker Desktop/Engine setup).

## Running in CI

A later CI task should run `./scripts/verify backend-acceptance` before pushing the backend
image — the image these tests exercise should be the exact one about to be pushed and deployed,
freshly built in the runner's local Docker daemon, never pulled from a registry.

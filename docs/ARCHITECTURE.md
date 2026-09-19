# Reforge architecture

This document is the entry point to the architecture documentation. It contains system-wide
constraints and routes readers to the detailed documentation for each subsystem. It
intentionally does not document individual classes, endpoints, or operational commands — those
live in the subsystem docs below, or are cheap to discover by reading the code.

Follow the patterns described across these documents when extending the app; if you deviate,
leave a comment explaining why.

## System overview

Reforge is composed of two independently deployable services, with no shared runtime code
between them:

- `api/` — .NET backend
- `app/` — React consumer application

Reforge is a fitness and nutrition coaching app: a user logs **comidas** (meals) — manually for
now, from their own **biblioteca de comidas** (meal library) or ad hoc — records **entrenamientos**
(workouts) and other **actividades** (activities), tracks **mediciones** (measurements), and
closes each day (**cierre del día**) to see weekly progress and keep a **racha** (streak) going.
AI-assisted meal analysis/coach chat and subscription billing are planned future slices, not part
of the current scope — see [`plan/`](plan/) for the delivery roadmap.

## System-wide rules

- Each deployable service owns its implementation and dependencies — no shared package or
  generated client between `api/` and `app/`.
- The backend (`api/`) is the source of truth for business rules.
- OpenAPI generated from the backend (`/swagger` in Development) is the source of truth for API
  routes and schemas — see [`API-CONVENTIONS.md`](API-CONVENTIONS.md) for the semantics that
  don't show up in a schema.
- Authentication is OIDC/JWT Bearer end-to-end (`fake-oidc` locally, Zitadel in production); the
  backend is stateless — every request is authenticated independently, there is no session state.
- Architectural exceptions or deviations from these docs should leave a comment explaining why;
  significant decisions get an ADR (see `adr/`, once any exist).

## Documentation map

Read only the documents relevant to the change:

| Change | Read |
|---|---|
| Backend domain, use cases, persistence, project boundaries | [`architecture/backend.md`](architecture/backend.md) |
| Consumer frontend (`app/`) | [`architecture/frontend.md`](architecture/frontend.md) |
| API authorization, error and product semantics | [`API-CONVENTIONS.md`](API-CONVENTIONS.md) |
| Running the stack locally | [`operations/local-development.md`](operations/local-development.md) |
| `Reforge.Api.Lite` (in-memory backend for frontend tests) | [`operations/api-lite.md`](operations/api-lite.md) |
| Delivery roadmap, locked decisions | [`plan/`](plan/) |

## Decision precedence

1. ADRs (`adr/`, once any exist) override general architecture within their stated scope.
2. This documentation defines intended conventions.
3. Existing code is evidence of implementation, not automatically the standard — code and docs
   drift; when they disagree, treat it as a bug in one of them, not a tiebreaker.

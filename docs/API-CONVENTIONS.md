# API conventions

Routes, request bodies, response schemas and HTTP status codes are generated from the
backend controllers — that's the source of truth, not this file. Run the stack (see the
`run` skill / `api/README.md`, once they exist) and open `http://localhost:5050/swagger`
for Swagger UI, or fetch `http://localhost:5050/swagger/v1/swagger.json` directly.

This file only covers the rules that don't show up in a generated schema: authorization
and error semantics.

## Authentication

All `/api/*` endpoints require a valid OIDC access token (`Authorization: Bearer <token>`)
unless explicitly marked `[AllowAnonymous]`.

Anonymous exceptions (walking skeleton):

- `GET /health` — liveness check.

This list will grow as future slices add public surface (e.g. app configuration endpoints);
keep it accurate rather than describing anonymous routes that don't exist yet.

## Errors

- `400 Bad Request` — invalid input, or an operation that can't be performed as requested.
- `401 Unauthorized` — missing or invalid authentication token.
- `403 Forbidden` — authenticated, but the caller has no access to this resource.
- `404 Not Found` — the resource doesn't exist, or its existence must not be disclosed to
  this caller.

All application error bodies share one shape, `{ "error": "..." }`. The mapping from an
application-layer failure to a status code is driven by `ApplicationError.Code`, not message text
(see [`architecture/backend.md`](architecture/backend.md#controllers) for the implementation).
Almost any authenticated endpoint can genuinely return any of 400/403/404 depending on what
failed, so the OpenAPI spec documents them uniformly rather than trying to guess which apply to a
given action. A `503 Service Unavailable` convention for downstream-dependency failures is
expected to be added once the backend actually depends on something that can be down; don't
document it before it exists.

## Authorization

The walking skeleton has a single authenticated user identity with no roles or per-resource
access rules — every authenticated user can see and modify only their own data (profile, meals,
workouts, measurements, etc.), scoped by the authenticated user id. This section will grow if a
future slice introduces shared or role-based access (e.g. a coach viewing a client's data).

## Contract changes

There's no generated HTTP client between `api/` and `app/`. The backend DTOs and controllers
remain the source of truth; DTO shapes are kept in sync by hand, following the same convention as
`el-baul` (see that repository's `docs/API-CONVENTIONS.md#contract-changes` for the pattern this
mirrors). The reviewed OpenAPI contract snapshot and the `scripts/openapi` helper that manages it
are added alongside the backend scaffold.

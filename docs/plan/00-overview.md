# Reforge implementation plan — overview

## Goal

Turn the current `reforge-frontend` (React/Vite, Supabase-backed) and
`recomp-coach-backend` (Deno/Hono/Supabase Edge Function) prototypes into a
proper monorepo, `reforge`, with two independently deployable services —
`app` (frontend) and `api` (backend, rewritten in .NET) — following the
architecture, tooling, and testing conventions established in the sibling
reference project `el-baul`.

`el-baul`, `reforge-frontend`, and `recomp-coach-backend` are available as
symlinks at the repo root for reference only. They are not part of the
final repo and are not committed to.

## Locked decisions

These were confirmed with the user on 2026-09-19 and should not be
re-litigated without asking again:

1. **Persistence**: full self-hosted stack like el-baul — Postgres via
   EF Core, docker-compose for local infra, no Supabase. MinIO is added
   only when a slice actually needs file storage (none of the deferred-scope
   slices currently do).
2. **Mobile**: web-only. No Capacitor/Android/iOS shells for now.
3. **Product language**: Spanish for domain terms/UI copy, following
   el-baul's own convention. Code, docs, commit messages, and comments are
   English regardless (el-baul's root rule, verbatim: *"Everything in this
   repo... MUST be written in english, EXCEPT domain terms that convey a
   special meaning"*).
4. **Feature scope**: the OpenAI-backed meal-analysis/coach-chat feature and
   the Stripe subscription/billing feature are **deferred**. They are not
   part of the walking skeleton or the initial core-domain slices. They come
   back as their own later slices once the skeleton and core domain are
   proven end-to-end.
5. **Slice 8 (AI coach) OpenAI testing**: confirmed with the user on
   2026-09-20 — mirror el-baul's `IAiChatBackend`/`FakeAiChatBackend`
   pattern. Real OpenAI HTTP calls live behind output ports in
   `Reforge.Infra`; `Reforge.Infra.Lite` (used by api-lite and unit/
   acceptance tests) gets fake/stub implementations. The real OpenAI API is
   never called from automated tests.
6. **Slice 8 `/analyze-meal` design**: confirmed with the user on
   2026-09-20 — one endpoint that analyzes and saves in the same call,
   mirroring `recomp-coach-backend`'s one-shot behavior, using the same
   meal-persistence path as `SaveMealAsync`. `POST /meals` is untouched and
   keeps handling manual entries.

## Architecture target (mirrors el-baul)

```
reforge/
  app/            React + TS + Vite frontend (adapted from reforge-frontend)
  api/            .NET backend (rewrite of recomp-coach-backend), ports-and-adapters
  docs/           ARCHITECTURE.md, API-CONVENTIONS.md, adr/, architecture/, operations/, plan/
  scripts/        run-env, verify, openapi, fake-oidc-token
  .claude/skills/ run, verify, update-changelog
  .github/workflows/  per-project pipelines (backend-cicd.yml, frontend-cicd.yml, storybook-cicd.yml, e2e-nightly.yml)
  docker-compose.yaml        full local stack (Postgres, fake-oidc, backend, frontend)
  docker-compose.lite.yml    frontend-only lite stack (api-lite + fake-oidc)
```

No shared package/generated client between `app` and `api` — DTOs are kept
in sync by hand via the OpenAPI snapshot + `scripts/openapi`, exactly as in
el-baul.

Auth: OIDC end to end. Local dev and CI use `fake-oidc`
(`ghcr.io/ne2-studio/fake-oidc`), production uses Zitadel. This replaces
Supabase Auth entirely — the frontend's `auth.service.ts` is rewritten
against `react-oidc-context`, and the backend gets a single JWT-bearer
middleware + current-user abstraction instead of the current per-route
`supabase.auth.getUser()` calls.

## Functional spec to preserve

The full endpoint/table inventory of `recomp-coach-backend` was captured
during research and drives the vertical slice breakdown below: user
profile, meal logging (manual, no AI yet), meal library, activities,
workouts, measurements, reminders, day-close/weekly-progress. AI coach chat
and Stripe billing are preserved as *future* slices, not dropped.

## Delivery strategy

Vertical slices, not layers. Each slice leaves the system fully working,
verified end to end (`scripts/verify all` green), and gets its own commit.
The **walking skeleton** (see `01-walking-skeleton.md`) comes first and
deliberately carries near-zero product logic — its entire purpose is to
prove the toolchain (auth, persistence, CI, all test layers, image-based
acceptance tests) so every subsequent slice is pure, low-risk, incremental
domain work.

See `02-vertical-slices.md` for the slice breakdown after the skeleton.

## Execution model

The orchestrating agent (this session) does not write code directly.
Every slice's implementation work is delegated to subagents with a
self-contained brief (relevant files, target files, acceptance criteria).
The orchestrator reviews the diff, runs `scripts/verify`, and commits.
Major design/architecture decisions not already settled in this plan are
raised with the user before a subagent starts on them.

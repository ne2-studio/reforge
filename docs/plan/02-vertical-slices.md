# Vertical slices (post-skeleton)

Each slice: real domain feature, both `api` and `app`, all test layers
(backend unit + persistence + acceptance-of-image, frontend unit/RTL +
Storybook + Playwright-against-api-lite), OpenAPI contract regenerated via
`scripts/openapi` if the HTTP surface changed, `scripts/verify all` green,
one commit. Slices are ordered by dependency; each is independently
shippable and leaves the app working.

## Slice 1 — User profile

- `api`: `Profile` feature (Core input/output ports, EF Core adapter,
  controller). Fields per existing schema: age, gender, height, weight,
  activity level, goal, training days/type/time, restrictions, calorie
  target, `extra_data` JSON escape hatch. `POST /profile`, `GET /profile`.
- `app`: onboarding/profile screens adapted from `OnboardingWizard.tsx` /
  `ProfileEditor.tsx`, wired to the new endpoints via hand-written fetch
  calls typed from the generated OpenAPI schema (no Supabase calls left).
- Acceptance: create profile via fake-oidc identity, reload, see it
  persisted; Playwright covers the flow against api-lite.

## Slice 2 — Meal logging (manual, no AI)

- `api`: `Meals` feature. `POST/GET /meals`, `GET /daily-stats/:date`.
  Manual entry only — calories/macros/feedback entered by the user, no
  OpenAI call yet (`analyze-meal` stays a stub or is simply not exposed
  until the AI slice).
  - **Locked decision**: `GET /day-history` is deferred to Slice 7. In
    the source backend it reads the `closed_days` table, which only the
    day-close feature (Slice 7) ever populates — a literal port now
    would always return an empty list. `closed_days` and `/day-history`
    are built together in Slice 7, where they're actually meaningful.
- `app`: `MealLogger`, `DailyStats`, `DaySummary` adapted to call the new
  endpoints. `MealHistory`/`DayHistory` (which need day-history/closed
  days) wait for Slice 7.

## Slice 3 — Meal library

- `api`: `MealLibrary` feature — CRUD for saved reusable meals.
- `app`: `MealLibrary.tsx` wired up; meal logger can pull from library.

## Slice 4 — Activities & workouts

- `api`: `Activities` and `Workouts` features (`POST/GET /activities`,
  `POST/GET /workouts`).
- `app`: `ActivityTracker`, `WorkoutTracker`.

## Slice 5 — Measurements

- `api`: `Measurements` feature (`POST/GET /measurement(s)`).
- `app`: relevant progress/measurement screens (`ProgressTracker`).

## Slice 6 — Reminders

- `api`: `Reminders` feature — 1:1 `reminder_settings` + many
  `custom_reminders`.
- `app`: reminder settings UI (currently not a standalone component in
  `reforge-frontend` — check `AccountSettings.tsx`/`Navigation.tsx` for
  where this belongs; confirm with user if no clear home exists).

## Slice 7 — Day close / weekly progress

- `api`: `closed_days` feature — close-the-day summarization,
  `GET /day-history` (deferred here from Slice 2 — see that slice's
  note), `GET /weekly-progress`.
- `app`: `DayHistory`, `MealHistory`, weekly progress views.

## Slice 8 — AI coach (deferred scope, revisit after slice 7)

- `api`: `POST /analyze-meal`, `POST /chat`, `GET /chat-history`, backed by
  OpenAI. Needs a decision on how OpenAI calls are tested (fake/stub
  adapter in api-lite and in unit tests; never call the real OpenAI API in
  automated tests) — raise with user before starting.
- `app`: `CoachChat`, `FloatingCoachButton`, AI-driven meal analysis in
  `MealLogger`.

## Slice 9 — Subscription & billing (deferred scope, revisit after slice 8)

- `api`: `subscriptions` + `usage_limits`, Stripe checkout/portal/webhook.
- `app`: `Subscription`, `UpgradeDialog`, `UsageLimits`, `AILimitReached`.
- Needs a decision on Stripe test-mode strategy for acceptance tests
  (stripe-mock or equivalent) — raise with user before starting.

## Notes

- Each slice's persistence/unit/acceptance test triad and the frontend's
  RTL/Storybook/Playwright triad are non-negotiable per slice — a slice
  isn't done until `scripts/verify all` is green with real coverage of the
  new behavior, not just passing-by-omission.
- Domain UI copy is in Spanish (per locked decision); code/tests/docs/
  commits stay English.

# Acceptance tests (deferred)

This suite is scaffolded (see `../playwright.config.ts`) but not implemented yet. It's built in
a follow-up task (`docs/plan/01-walking-skeleton.md`, task #5): Playwright against the built
frontend image + `Reforge.Api.Lite`, with a `global-setup`/`global-teardown` that boot both
images plus a `fake-oidc` container, and at least one test that logs in and sees the ping
result — mirroring `el-baul/app/acceptance-tests`.

Not run as part of this task's verification; `npm run test:acceptance` will fail until that
follow-up adds real spec files here.

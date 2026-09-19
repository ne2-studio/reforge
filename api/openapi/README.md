# OpenAPI snapshot

`v1.swagger.json` in this directory is the reviewed OpenAPI contract snapshot, generated (not
hand-edited) by `./scripts/openapi accept-contract` from `Reforge.Api.Tests`' snapshot test
once that project exists (see `docs/plan/01-walking-skeleton.md`, task #5). `./scripts/openapi
generate-types` reads it to produce `app/src/api/generated/schema.ts`.

This directory is created ahead of that project so both script paths resolve; the snapshot
file itself doesn't exist until `accept-contract` has run at least once.

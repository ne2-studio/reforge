---
name: update-changelog
description: "Reminds an agent to update CHANGELOG.md before committing a user-facing change. Use before every commit."
model: haiku
---

## Goal

Keep `CHANGELOG.md` an accurate, user-facing record — without noise.

## Before committing

1. Does this commit change what a user of the app can see or do (a feature,
   a fix, a behavior change, a removal, a security fix)?
   - **No** (tests, refactors, docs, CI, chores, internal tooling) → do nothing.
   - **Yes** → continue.
2. Add a bullet under `## [Unreleased]` in `CHANGELOG.md`, in the matching
   [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) category
   (Added, Changed, Deprecated, Removed, Fixed, Security). Create the
   category heading if it's missing.
3. Write the bullet in **Spanish**, in plain product language (no ticket IDs,
   internal names, or implementation detail) — the audience is end users, and
   Reforge's product copy is Spanish (see the root `CLAUDE.md` language rule).
   The section/category headers themselves stay in English.
4. Commit the changelog update together with the change.

When a new tag is cut, `[Unreleased]` gets renamed to that tag (with today's
date) and a fresh empty `[Unreleased]` is added above it — do this as part of
the release, not as part of a feature commit.

## Keep CHANGELOG.md short

Once the project has enough tagged releases to matter, follow `el-baul`'s
convention: keep only `[Unreleased]` plus the last 2 tagged versions in
`CHANGELOG.md`, and move older ones to `CHANGELOG-ARCHIVE.md` (newest first).

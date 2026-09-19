# Reforge

Reforge helps people track meals, workouts, activities and measurements, close
each day's log, and keep a coaching streak going.

## Repository structure

Monorepo, two independently deployable services, **no shared code between them**

```
api/   # .NET backend, ports & adapters
app/   # React + TypeScript + Vite frontend
```

## Documentation

Read the relevant docs before making architectural or cross-service changes.

```
docs/ARCHITECTURE.md
docs/API-CONVENTIONS.md
docs/architecture/backend.md
docs/architecture/frontend.md
docs/operations/local-development.md
docs/operations/api-lite.md
```

## Workflow

This project uses trunk-based development.
Always use conventional commits.

## Language

Everything in this repo (incl. but not limited to code, docs, commit msgs...) MUST be
written in english, EXCEPT domain terms that convey a special meaning, such as Comida
(meal), Entrenamiento (workout), Racha (streak), Cierre del día (day close), etc. This
list is not exhaustive — extend it as new domain terms show up.

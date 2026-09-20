# Changelog

All notable changes to Reforge are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Initial repository scaffold: root README, CLAUDE.md/AGENTS.md, architecture and operations
  docs (`docs/ARCHITECTURE.md`, `docs/API-CONVENTIONS.md`, `docs/architecture/backend.md`,
  `docs/architecture/frontend.md`, `docs/operations/local-development.md`,
  `docs/operations/api-lite.md`), and the `run`/`verify`/`update-changelog` Claude skills,
  adapted from `el-baul`.
- Manual meal logging: log a meal's macros by hand and see the day's calorie/protein/carb/fat
  totals update against your targets.
- Meal library: save a logged meal as a reusable template, browse/delete your saved meals
  grouped by category, and load one back into the meal logger to pre-fill its fields.
- Activity and workout tracking: log strength/cardio/NEAT activities and strength/cardio
  workouts, with a history list (activities) or stat cards and charts (workouts).
- Progress tracking: log weight/waist/neck measurements and see stat cards and trend charts,
  including a body-fat % and lean-mass estimate computed from your profile once enough data is
  available.
- Recordatorios: activa avisos generales (canal y hora por defecto) y crea tus propios
  recordatorios personalizados (mensaje, hora y días de la semana) desde la pantalla de perfil.
- Cierre del día: cierra tu día manualmente y consulta su resumen (comidas registradas, calorías
  totales y si fue día de entrenamiento) en tu historial, más tu progreso semanal de déficit y
  superávit calórico con la racha de días en déficit.
- Coach de IA: chatea con tu coach personal desde un botón flotante en Comidas, y registra una
  comida describiéndola en texto libre para que la IA calcule sus macros y la guarde por ti.

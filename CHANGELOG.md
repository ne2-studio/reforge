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
  available, plus a weekly calorie deficit/surplus summary and adherence streak under "Resumen
  semanal".
- Coach de IA: chatea con tu coach personal desde un botón flotante en Comidas, y registra una
  comida describiéndola en texto libre para que la IA calcule sus macros y la guarde por ti.
- Suscripción Premium: consulta tu plan y tu uso de funciones de IA desde el perfil, mejora tu
  plan o gestiona tu facturación, y recibe un aviso cuando alcances el límite de uso gratuito del
  coach de IA.

### Changed

- Tras iniciar sesión llegas a una pantalla de inicio con la barra de navegación (Inicio,
  Comidas, Actividad, Coach, Progreso) para moverte entre las secciones de la app.
- Nueva cabecera con el logo de Reforge y un menú de usuario (acceso a Perfil, Historial de
  comidas, Mi suscripción y Cerrar sesión) visible en toda la app.
- Nuevo tema visual con tonos naranja/ámbar en lugar de lima/cian.
- El resumen de calorías y macros de hoy ahora se ve en la pantalla de Inicio (antes solo
  estaba en Comidas), junto con las tarjetas de objetivo, racha, comidas de hoy y actividad de
  hoy (antes "Registro de actividad").
- La pantalla de Comidas ahora muestra tu historial completo de la última semana, agrupado por
  día, en lugar de solo las comidas de hoy; el formulario para registrar una comida se abre
  ahora desde un botón "Registrar comida" en una ventana modal, en vez de estar siempre visible
  en la pantalla.
- El menú de usuario ya no incluye el enlace a "Progreso semanal": ese contenido ahora vive
  como pestaña "Resumen semanal" dentro de la pantalla Progreso, junto a "Medidas y evolución".
- La barra de navegación se sustituye por un menú lateral colapsable (abierto por defecto en
  ordenador, cerrado en móvil) con un botón para mostrarlo u ocultarlo. La sección Progreso se
  divide en dos entradas propias del menú, "Medidas y evolución" y "Resumen semanal", en lugar
  de ser pestañas dentro de una única pantalla Progreso.
- En la pantalla "Medidas y evolución", las 6 tarjetas de métricas se muestran en dos filas de
  tres (antes una sola fila de seis) para que cada tarjeta tenga más espacio.

### Fixed

- Tu objetivo diario de calorías ahora se calcula a partir de tu edad, sexo, altura, peso,
  nivel de actividad y objetivo (perder grasa, ganar músculo, recomposición o mantener), en
  lugar de mostrar siempre 2000 kcal cuando no tienes un objetivo personalizado guardado.
- El objetivo "perder grasa" aplicaba un déficit fijo de 500 kcal, demasiado agresivo para
  quien tiene un gasto calórico bajo; ahora el déficit es del 15% sobre tu gasto calórico
  total. Además, los entrenos y actividades registrados hoy suman kcal a tu objetivo (cardio y
  NEAT, según duración/pasos; fuerza, una cantidad fija por sesión).
- En la pantalla de Perfil ya no aparece la pestaña "Inicio" marcada como activa en la barra de
  navegación.

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 2's frontend acceptance criterion (docs/plan/02-vertical-slices.md): manual meal
// logging. Daily-stats needs a saved profile to compute targets (mirrors the backend's own
// MealsJourneyTests.cs), so this first completes onboarding, then logs a manual meal and
// checks it shows up in the day's list with daily-stats reflecting it, surviving a reload.
test('user logs a manual meal, sees it reflected in daily-stats, and it survives a reload', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  // A different fake-oidc user than profile.spec.ts's — both specs complete onboarding for
  // their own user, and this suite otherwise shares no state with that one.
  await loginAs(page, 'Reforge User 2');
  await page.getByRole('button', { name: 'Mi perfil' }).click();

  await expect(page.getByText('Paso 1 de 5')).toBeVisible();
  await page.getByLabel('Edad').fill('28');
  await page.getByLabel('Hombre').check();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByText('Paso 2 de 5')).toBeVisible();
  await page.getByLabel('Peso (kg)').fill('82.5');
  await page.getByLabel('Altura (cm)').fill('181');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByText('Paso 3 de 5')).toBeVisible();
  await page.getByRole('combobox').click();
  await page.getByText('⚡ Recomposición').click();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByText('Paso 4 de 5')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByText('Paso 5 de 5')).toBeVisible();
  await page.getByRole('button', { name: 'Completar' }).click();

  await expect(page.getByRole('heading', { name: 'Tu perfil' })).toBeVisible();

  await page.goto('/comidas');

  await expect(page.getByRole('heading', { name: 'Comidas', exact: true })).toBeVisible();

  await page.getByLabel('Descripción').fill('Pollo con arroz y verduras');
  await page.getByLabel('Calorías (kcal)').fill('600');
  await page.getByLabel('Proteína (g)').fill('50');
  await page.getByLabel('Carbohidratos (g)').fill('60');
  await page.getByLabel('Grasas (g)').fill('15');
  await page.getByRole('button', { name: 'Guardar comida' }).click();

  await expect(page.getByText('Pollo con arroz y verduras')).toBeVisible();
  await expect(page.getByText('600 kcal')).toBeVisible();
  await expect(page.getByText('600 / ', { exact: false })).toBeVisible();
  await expect(page.getByText('50 / ', { exact: false })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Comidas', exact: true })).toBeVisible();
  await expect(page.getByText('Pollo con arroz y verduras')).toBeVisible();
  await expect(page.getByText('600 kcal')).toBeVisible();
  await expect(page.getByText('600 / ', { exact: false })).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

// Slice 8's frontend acceptance criterion (docs/plan/02-vertical-slices.md): AI-driven meal
// analysis (`POST /analyze-meal`). Kept in this file rather than coach.spec.ts, and appended
// after the manual-meal test above rather than as its own top-level spec, specifically so it
// runs *after* that test's exact daily-stats totals have already been asserted — Reforge.Api.
// Lite's FakeMealAnalysisBackend (docs/operations/api-lite.md) always returns the same fixed
// macros, so this test's own assertions below are on that meal specifically, not on the day's
// running totals (which now also include the manual meal from the test above).
test('user logs a meal via AI analysis, and it is saved with the backend-computed macros', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User 2');
  await page.goto('/comidas');

  await expect(page.getByRole('heading', { name: 'Comidas', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Analizar con IA' }).click();

  await page.getByLabel('Descripción').fill('2 huevos revueltos con aguacate y 2 tostadas');
  await page.getByRole('button', { name: 'Analizar y guardar' }).click();

  await expect(page.getByText('2 huevos revueltos con aguacate y 2 tostadas')).toBeVisible();
  await expect(page.getByText('500 kcal')).toBeVisible();
  await expect(page.getByText('30g proteína')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

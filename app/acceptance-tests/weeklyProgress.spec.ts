import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 7's frontend acceptance criterion (docs/plan/02-vertical-slices.md): weekly progress.
// Mirrors measurements.spec.ts's scope and reasoning — logs a meal and confirms it's reflected
// in "Resumen semanal", surviving a reload. "Day close" was removed from the product (formerly
// tested here as dayClose.spec.ts), so this only covers weekly progress. "Resumen semanal" is
// its own top-level nav entry (previously a tab inside "Progreso"/historial). Uses "Reforge
// User" (not "Reforge User 2", which meals.spec.ts/measurements.spec.ts/mealLibrary.spec.ts/
// workouts.spec.ts already use).
test('user logs a meal and sees it reflected in weekly progress', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User');
  await page.goto('/comidas');

  await expect(page.getByRole('heading', { name: 'Comidas', exact: true })).toBeVisible();
  await page.getByLabel('Descripción').fill('Pollo con arroz y verduras');
  await page.getByLabel('Calorías (kcal)').fill('600');
  await page.getByLabel('Proteína (g)').fill('50');
  await page.getByLabel('Carbohidratos (g)').fill('60');
  await page.getByLabel('Grasas (g)').fill('15');
  await page.getByRole('button', { name: 'Guardar comida' }).click();
  await expect(page.getByText('Pollo con arroz y verduras')).toBeVisible();

  await page.getByRole('button', { name: 'Resumen semanal' }).click();

  await expect(page.getByText('En déficit').or(page.getByText('En superávit'))).toBeVisible();

  await page.reload();

  await expect(page.getByText('En déficit').or(page.getByText('En superávit'))).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

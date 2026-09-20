import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 7's frontend acceptance criterion (docs/plan/02-vertical-slices.md): day close /
// weekly progress. Mirrors measurements.spec.ts's scope and reasoning — logs a meal, closes
// the day, and confirms it shows up in both the "Días cerrados" and "Progreso semanal" tabs of
// /historial, surviving a reload. Uses "Reforge User" (not "Reforge User 2", which
// meals.spec.ts/measurements.spec.ts/mealLibrary.spec.ts/workouts.spec.ts already use), and is
// the only spec that calls POST /close-day for it, so there's no risk of a stale "already
// closed today" from another spec sharing the same user.
test('user logs a meal, closes the day, and sees it in day history and weekly progress', async ({ page }) => {
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

  await page.goto('/historial');

  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar día' }).click();

  await expect(page.getByRole('button', { name: 'Cerrar día' })).not.toBeVisible();

  await page.getByRole('tab', { name: 'Días cerrados' }).click();
  await expect(page.getByText('600 kcal')).toBeVisible();
  await expect(page.getByText('1 comida', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Progreso semanal' }).click();
  await expect(page.getByText('En déficit').or(page.getByText('En superávit'))).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible();
  await page.getByRole('tab', { name: 'Días cerrados' }).click();
  await expect(page.getByText('600 kcal')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 4's frontend acceptance criterion (docs/plan/02-vertical-slices.md): workout tracking.
// Workouts don't depend on a saved profile, unlike Slice 2's daily-stats, so this reuses
// "Reforge User 2" without repeating onboarding — Playwright runs with workers: 1, so there's
// no interleaving with meals.spec.ts/mealLibrary.spec.ts's own use of the same user, and
// workouts are a separate entity from meals/meal-library items.
test('user logs a strength workout and a cardio workout, and they survive a reload', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User 2');
  await page.getByRole('button', { name: 'Entrenamientos' }).click();

  await expect(page.getByRole('heading', { name: 'Entrenamientos' })).toBeVisible();
  await expect(page.getByText('Aún no has registrado ningún entreno')).toBeVisible();

  // Strength (the default type) — volume-based.
  await page.getByRole('button', { name: 'Nuevo entreno' }).click();
  await page.getByLabel('Volumen total levantado (kg)').fill('2500');
  await page.getByRole('button', { name: 'Guardar entreno' }).click();

  await expect(page.getByText('2,500 kg')).toBeVisible();

  // Cardio — duration-based.
  await page.getByRole('button', { name: 'Nuevo entreno' }).click();
  await page.getByRole('button', { name: 'Cardio' }).click();
  await page.getByLabel('Duración (minutos)').fill('30');
  await page.getByRole('button', { name: 'Guardar entreno' }).click();

  await expect(page.getByText('30 min')).toBeVisible();
  await expect(page.getByText('Volumen de fuerza')).toBeVisible();
  await expect(page.getByText('Duración de cardio')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Entrenamientos' })).toBeVisible();
  await expect(page.getByText('2,500 kg')).toBeVisible();
  await expect(page.getByText('30 min')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

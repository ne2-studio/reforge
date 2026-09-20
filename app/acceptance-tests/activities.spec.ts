import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 4's frontend acceptance criterion (docs/plan/02-vertical-slices.md): activity tracking.
// Activities don't depend on a saved profile, unlike Slice 2's daily-stats, so this reuses
// "Reforge User" without repeating onboarding — Playwright runs with workers: 1, so there's no
// interleaving with profile.spec.ts's own use of the same user, and activities are a separate
// entity from the profile.
test('user logs a strength activity and a NEAT activity, and they survive a reload', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User');
  await page.getByRole('button', { name: 'Actividad' }).click();

  await expect(page.getByRole('heading', { name: 'Actividad', exact: true })).toBeVisible();
  await expect(page.getByText('Aún no has registrado ninguna actividad')).toBeVisible();

  // Strength (the default type) — duration-based.
  await page.getByRole('button', { name: 'Registrar actividad' }).click();
  await page.getByLabel('Duración (minutos)').fill('45');
  await page.getByRole('button', { name: 'Guardar actividad' }).click();

  await expect(page.getByText('Entreno de fuerza')).toBeVisible();
  await expect(page.getByText('45 min')).toBeVisible();
  await expect(page.getByText('270 kcal')).toBeVisible();

  // NEAT — steps-based.
  await page.getByRole('button', { name: 'Registrar actividad' }).click();
  await page.getByRole('button', { name: 'NEAT' }).click();
  await page.getByLabel('Número de pasos').fill('8000');
  await page.getByRole('button', { name: 'Guardar actividad' }).click();

  await expect(page.getByText('8,000 pasos')).toBeVisible();
  await expect(page.getByText('320 kcal')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Actividad', exact: true })).toBeVisible();
  await expect(page.getByText('Entreno de fuerza')).toBeVisible();
  await expect(page.getByText('45 min')).toBeVisible();
  await expect(page.getByText('8,000 pasos')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 5's frontend acceptance criterion (docs/plan/02-vertical-slices.md): progress tracking.
// Measurements don't depend on a saved profile, unlike Slice 2's daily-stats — the body-fat/
// lean-mass estimate is only computed once a profile with height/gender exists, which this
// suite doesn't set up, so it isn't asserted here. This reuses "Reforge User 2" without
// repeating onboarding — Playwright runs with workers: 1, so there's no interleaving with
// other specs' own use of the same user, and measurements are a separate entity from meals/
// meal-library items/workouts.
test('user logs a measurement, and it survives a reload', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User 2');
  await page.getByRole('button', { name: 'Medidas y evolución' }).click();

  await expect(page.getByRole('heading', { name: 'Tu progreso' })).toBeVisible();
  await expect(page.getByText('Aún no tienes medidas')).toBeVisible();

  await page.getByRole('button', { name: 'Nueva medida' }).click();
  await page.getByLabel('Peso (kg)').fill('82.5');
  await page.getByLabel('Cintura (cm)').fill('90');
  await page.getByLabel('Cuello (cm)').fill('40');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('82.5 kg')).toBeVisible();
  await expect(page.getByText('90 cm')).toBeVisible();
  await expect(page.getByText('40 cm')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Tu progreso' })).toBeVisible();
  await expect(page.getByText('82.5 kg')).toBeVisible();
  await expect(page.getByText('90 cm')).toBeVisible();
  await expect(page.getByText('40 cm')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 3's frontend acceptance criterion (docs/plan/02-vertical-slices.md): a meal library
// screen where the user can save/browse/delete reusable meal templates, plus the meal logger's
// "cargar de biblioteca"/"guardar en biblioteca" wiring on top of it. Meal library items don't
// depend on a saved profile, unlike Slice 2's daily-stats, so this reuses "Reforge User 2"
// without repeating onboarding — Playwright runs this suite's file sequentially after
// meals.spec.ts (workers: 1, fullyParallel: false), so there's no interleaving with that
// suite's own use of the same user, and meal library items are a separate entity from meals.
test('user adds and deletes a meal library item, and it survives a reload', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User 2');
  await page.getByRole('button', { name: 'Biblioteca' }).click();

  await expect(page.getByRole('heading', { name: 'Biblioteca de comidas' })).toBeVisible();
  await expect(page.getByText('Aún no has guardado ninguna comida en tu biblioteca.')).toBeVisible();

  // Add a library item via the meal logger's "guardar en biblioteca" affordance, exercising
  // that wiring alongside the CRUD screen itself.
  await page.goto('/comidas');
  await page.getByLabel('Descripción').fill('Pollo con arroz y verduras');
  await page.getByLabel('Calorías (kcal)').fill('600');
  await page.getByLabel('Proteína (g)').fill('50');
  await page.getByLabel('Carbohidratos (g)').fill('60');
  await page.getByLabel('Grasas (g)').fill('15');

  await page.getByRole('button', { name: 'Guardar en biblioteca' }).click();
  await page.getByLabel('Título').fill('Pollo con arroz');
  await page.getByRole('button', { name: 'Guardar' }).click();

  // The dialog closes and the "cargar de biblioteca" picker appears once the item is saved
  // (no <Toaster/> mounted app-wide yet to assert a success toast against — see MealsRoute's
  // own acceptance test, which doesn't assert on toasts either).
  await expect(page.getByLabel('Título')).not.toBeVisible();
  await expect(page.getByLabel('Cargar de biblioteca')).toBeVisible();

  // "Cargar de biblioteca" pre-fills the manual form from the saved item.
  await page.getByLabel('Descripción').fill('');
  await page.getByLabel('Calorías (kcal)').fill('');
  await page.getByLabel('Cargar de biblioteca').click();
  await page.getByRole('option', { name: 'Pollo con arroz' }).click();
  await expect(page.getByLabel('Descripción')).toHaveValue('Pollo con arroz y verduras');
  await expect(page.getByLabel('Calorías (kcal)')).toHaveValue('600');

  await page.goto('/biblioteca-comidas');

  await expect(page.getByRole('heading', { name: 'Biblioteca de comidas' })).toBeVisible();
  await expect(page.getByText('Pollo con arroz', { exact: true })).toBeVisible();
  await expect(page.getByText('600 kcal')).toBeVisible();

  await page.reload();

  await expect(page.getByText('Pollo con arroz', { exact: true })).toBeVisible();
  await expect(page.getByText('600 kcal')).toBeVisible();

  await page.getByRole('button', { name: 'Eliminar Pollo con arroz' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar', exact: true }).click();

  await expect(page.getByText('Aún no has guardado ninguna comida en tu biblioteca.')).toBeVisible();

  await page.reload();

  await expect(page.getByText('Aún no has guardado ninguna comida en tu biblioteca.')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

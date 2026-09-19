import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 1's frontend acceptance criterion (docs/plan/02-vertical-slices.md): a user without a
// saved profile sees the onboarding wizard, completes it, and after a reload sees the same
// data reflected — now via the editor, since a profile exists after the first save.
test('user completes onboarding, and the saved profile survives a reload', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User');
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
  await page.getByText('💪 Ganar músculo').click();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByText('Paso 4 de 5')).toBeVisible();
  await page.getByLabel(/Alergias/).fill('Sin lactosa');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.getByText('Paso 5 de 5')).toBeVisible();
  await page.getByLabel('Lunes').check();
  await page.getByLabel('Miércoles').check();
  await page.getByRole('button', { name: 'Completar' }).click();

  await expect(page.getByRole('heading', { name: 'Tu perfil' })).toBeVisible();
  await expect(page.getByText('28 años')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Tu perfil' })).toBeVisible();
  await expect(page.getByText('28 años')).toBeVisible();
  await expect(page.getByText('Hombre')).toBeVisible();
  await expect(page.getByText('82.5 kg')).toBeVisible();
  await expect(page.getByText('181 cm')).toBeVisible();
  await expect(page.getByText('Ganar músculo')).toBeVisible();
  await expect(page.getByText('Sin lactosa')).toBeVisible();
  await expect(page.getByText('Lunes')).toBeVisible();
  await expect(page.getByText('Miércoles')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

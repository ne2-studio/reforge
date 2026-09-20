import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 6's frontend acceptance criterion (docs/plan/02-vertical-slices.md): a Recordatorios
// section inside the profile screen (no standalone route) where the user can toggle reminder
// settings and manage custom reminders. The Recordatorios section only renders once a profile
// exists (see ProfileEditor.tsx), so this reuses "Reforge User" *after* profile.spec.ts has
// completed its onboarding — Playwright runs with workers: 1 and discovers spec files in
// alphabetical order, so "profile.spec.ts" always runs before this file, same reasoning as
// activities.spec.ts's/mealLibrary.spec.ts's own file-ordering comments.
test('user configures reminder settings and manages a custom reminder, surviving a reload', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User');
  await page.getByRole('button', { name: 'Mi perfil' }).click();

  await expect(page.getByRole('heading', { name: 'Recordatorios', exact: true })).toBeVisible();
  await expect(page.getByLabel('Activar recordatorios')).not.toBeChecked();

  await page.getByLabel('Activar recordatorios').click();
  await page.getByLabel('Hora por defecto').fill('07:30');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();

  await page.reload();
  await expect(page.getByLabel('Activar recordatorios')).toBeChecked();
  await expect(page.getByLabel('Hora por defecto')).toHaveValue('07:30');

  await expect(page.getByText('Aún no tienes recordatorios personalizados.')).toBeVisible();

  await page.getByRole('button', { name: 'Nuevo' }).click();
  await page.getByLabel('Mensaje').fill('Registra tu cena');
  await page.getByLabel('Hora', { exact: true }).fill('20:00');
  await page.getByRole('button', { name: 'Lunes' }).click();
  await page.getByRole('button', { name: 'Miércoles' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('Registra tu cena')).toBeVisible();
  await expect(page.getByText('20:00 · Lunes, Miércoles')).toBeVisible();

  await page.reload();

  await expect(page.getByText('Registra tu cena')).toBeVisible();
  await expect(page.getByText('20:00 · Lunes, Miércoles')).toBeVisible();

  await page.getByRole('button', { name: 'Eliminar Registra tu cena' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar', exact: true }).click();

  await expect(page.getByText('Aún no tienes recordatorios personalizados.')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Aún no tienes recordatorios personalizados.')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

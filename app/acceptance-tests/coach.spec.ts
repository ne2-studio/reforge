import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Slice 8's frontend acceptance criterion (docs/plan/02-vertical-slices.md): the AI coach chat.
// The AI-driven meal-analysis path is covered by meals.spec.ts instead of here (see that
// file's own comment): it persists a meal, and coach.spec.ts's filename sorts alphabetically
// before both meals.spec.ts and weeklyProgress.spec.ts, which each assert *exact* daily
// totals/calorie counts for "Reforge User"/"Reforge User 2" — an extra meal landing before
// either of those ran would silently inflate their totals. The chat test below has no such
// risk: chat messages are a separate table from meals, so any user/order is safe. Reuses
// "Reforge User" — arbitrarily, since this suite doesn't create profile/meal state that any
// other spec depends on.
test('user chats with the coach and its reply survives a reload', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await loginAs(page, 'Reforge User');
  await page.goto('/comidas');

  await expect(page.getByRole('heading', { name: 'Comidas', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Habla con tu coach' }).click();

  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole('heading', { name: 'Coach de IA' })).toBeVisible();

  await page.getByPlaceholder('Escribe tu mensaje...').fill('¿Qué debería desayunar hoy?');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.getByText('¿Qué debería desayunar hoy?')).toBeVisible();
  await expect(page.getByText('Respuesta de prueba')).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Coach de IA' })).toBeVisible();
  await expect(page.getByText('¿Qué debería desayunar hoy?')).toBeVisible();
  await expect(page.getByText('Respuesta de prueba')).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
});

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// The walking skeleton's one real journey: log in via fake-oidc, land on /ping, and see the
// backend's authenticated response (proves OIDC + backend auth + user-sync wiring end to end).
// Kept as its own file rather than shared/imported — mirrors el-baul's login.spec.ts, scoped
// down to Reforge's single authenticated screen (no baúl/persona/photo domain yet).
test('user can log in with fake-oidc and reach the authenticated ping screen', async ({ page }) => {
  const pageErrors: Error[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));
  page.on('response', (res) => {
    if (res.status() >= 400) {
      failedRequests.push(`${res.status()} ${res.url()}`);
    }
  });

  await loginAs(page, 'Reforge User');

  await expect(page.getByRole('heading', { name: 'Ping autenticado' })).toBeVisible();
  await expect(page.getByText('Consultando la API…')).toBeHidden();
  await expect(page.getByText('reforge-user', { exact: true })).toBeVisible();

  expect(pageErrors, pageErrors.map(String).join('\n')).toEqual([]);
  expect(failedRequests, failedRequests.join('\n')).toEqual([]);
});

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Shared by every spec in this directory only — not a future repo-root e2e suite, which
// would have its own equivalent logic. Two independent suites, no cross-suite coupling.
export async function loginAs(page: Page, userButtonName: 'Reforge User' | 'Reforge User 2'): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL('**/authorize**', { timeout: 15_000 });
  await page.getByRole('button', { name: userButtonName, exact: true }).click();
  // Every successful login lands on the Inicio dashboard (GuestOnly redirects to /home).
  await page.waitForURL('**/home', { timeout: 15_000 });

  const accessToken = await page.evaluate(() => {
    const raw = localStorage.getItem('oidc.user:http://localhost:5000:reforge-app');
    return raw ? JSON.parse(raw).access_token : null;
  });
  expect(accessToken, 'expected an access token in localStorage after login').toBeTruthy();
  return accessToken as string;
}

import { test, expect } from '@playwright/test';

test('landing page has title and get started button', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Lila/);

  // Expect to find a "Get Started" link/button
  const getStarted = page.getByRole('link', { name: /get started/i });
  await expect(getStarted).toBeVisible();
});

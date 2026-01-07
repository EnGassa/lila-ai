import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('visitor can navigate from landing page to login', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('/');
    
    // 2. Click "Get Started"
    // Note: It's a link styled as a button
    await page.getByRole('link', { name: 'Get Started' }).click();
    
    // 3. Verify URL is /login
    await expect(page).toHaveURL(/\/login/);
    
    // 4. Verify Login Page elements
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible();
  });

  test('visitor can submit login form', async ({ page }) => {
    // Mock Supabase Auth Request to avoid real emails
    // Supabase v2 signInWithOtp usually hits /auth/v1/otp or /auth/v1/magic-link
    await page.route('**/auth/v1/**', async route => {
      const json = { user: { id: 'test-user', email: 'test@example.com' } };
      await route.fulfill({ json });
    });

    await page.goto('/login');
    
    // Fill Email
    await page.getByLabel('Email').fill('test@example.com');
    
    // Submit
    await page.getByRole('button', { name: 'Send Magic Link' }).click();
    
    // Verify Success State
    await expect(page.getByText('Check your email')).toBeVisible();
    await expect(page.getByText('We sent a login link to test@example.com')).toBeVisible();
  });
});

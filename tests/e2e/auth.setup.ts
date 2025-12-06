import { test as setup } from '@playwright/test';

/**
 * Authentication setup for E2E tests
 *
 * This file sets up authentication for the test suite.
 * If you have test credentials, add them to .env.test:
 * TEST_USER_EMAIL=test@example.com
 * TEST_USER_PASSWORD=testpassword123
 */

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    console.log('No test credentials found. Tests will run without authentication.');
    console.log('Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables for authenticated tests.');
    return;
  }

  // Navigate to the app
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click Sign In button
  const signInButton = page.locator('button:has-text("Sign In")');
  if (await signInButton.isVisible({ timeout: 2000 })) {
    await signInButton.click();

    // Fill in credentials
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);

    // Submit form
    await page.locator('button[type="submit"]:has-text("Sign In")').click();

    // Wait for successful authentication
    await page.waitForTimeout(2000);

    // Save authentication state
    await page.context().storageState({ path: authFile });
  }
});

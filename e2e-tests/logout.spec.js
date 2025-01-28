// @ts-check
import { test, expect } from '@playwright/test';

test.describe("Logout Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
    const username = 'testuser1';
    const password = '123456';

    const usernameInput = page.getByLabel('username');
    const passwordInput = page.getByLabel('password');

    await usernameInput.fill(username);
    await passwordInput.fill(password);

    // Find and click the login button
    const loginButton = page.getByRole('button', { name: /login/i });
    await loginButton.click();

  });
  test('user logs out successfully', async ({ page }) => {
    // Assert - user is logged in
    await expect(page).toHaveURL('/dashboard');

    // Check for success message or authenticated state
    const welcomeMessage = page.getByText(`Welcome to BabySwap`);
    await expect(welcomeMessage).toBeVisible();

    // Verify user is properly authenticated
    const logoutButton = page.getByRole('navigation').getByRole('link', { name: /Logout/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Assert - user is return to login page
    await expect(page).toHaveURL('/');
  });
})

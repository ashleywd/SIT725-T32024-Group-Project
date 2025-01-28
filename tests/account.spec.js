// @ts-check
import { test, expect } from '@playwright/test';

test.describe("Account Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('http://localhost:3000/login');
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
  test('user access the account page successfully', async ({ page }) => {
    // Assert - user is logged in
    await expect(page).toHaveURL('http://localhost:3000/dashboard');

    // Navigate to the account page
    const logoutButton = page.getByRole('navigation').getByRole('link', { name: /Account/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Check for account page title
    const accountTitle = page.getByText(`Account Details:`);
    await expect(accountTitle).toBeVisible();

    // Assert - user is in the right url
    await expect(page).toHaveURL('http://localhost:3000/account');
  });
})

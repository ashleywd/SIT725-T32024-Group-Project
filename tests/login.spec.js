// @ts-check
import { test, expect } from '@playwright/test';

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('http://localhost:3000/login');
  });
  test('user logs in successfully', async ({ page }) => {
    const username = 'testuser1';
    const password = '123456';

    const usernameInput = page.getByLabel('username');
    const passwordInput = page.getByLabel('password');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill(username);
    await passwordInput.fill(password);

    // Find and click the login button
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    // Assert - Verify successful login
    // Wait for navigation or success indicator
    await expect(page).toHaveURL('http://localhost:3000/dashboard');

    // Check for success message or authenticated state
    const welcomeMessage = page.getByText(`Welcome to BabySwap`);
    await expect(welcomeMessage).toBeVisible();

    // Verify user is properly authenticated
    const logoutButton = page.getByRole('navigation').getByRole('link', { name: /Logout/i });
    await expect(logoutButton).toBeVisible();
  });

  test('user gets an error', async ({ page }) => {
    const username = 'unexistingUser';
    const password = '123456';

    const usernameInput = page.getByLabel('username');
    const passwordInput = page.getByLabel('password');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill(username);
    await passwordInput.fill(password);

    // Find and click the login button
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    // Check for error message
    const errorMessage = page.getByText(`Invalid username or password`);
    await expect(errorMessage).toBeVisible();
  });
})

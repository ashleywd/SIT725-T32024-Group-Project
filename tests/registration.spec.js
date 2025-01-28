// @ts-check
import { test, expect } from '@playwright/test';

const getRandomInt = (max) => Math.floor(Math.random() * max);

test.describe("Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Registration page before each test
    await page.goto('http://localhost:3000/register');
  });
  test('user registers successfully', async ({ page }) => {
    const randomNumber = + getRandomInt(1000);
    const username = `testuser-${randomNumber}`;
    const email = `test-${randomNumber}@test.com`;
    const password = '123456';

    const usernameInput = page.getByLabel('username');
    const emailInput = page.getByLabel('email');
    const passwordInput = page.getByLabel('password');

    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill(username);
    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Find and click the register button
    const registerButton = page.getByRole('button', { name: /register/i });
    await expect(registerButton).toBeEnabled();
    await registerButton.click();

    // Assert - Verify successful registration
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
    const username = `testuser1`;
    const email = `test-1@test.com`;
    const password = '123456';

    const usernameInput = page.getByLabel('username');
    const emailInput = page.getByLabel('email');
    const passwordInput = page.getByLabel('password');

    await expect(usernameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill(username);
    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Find and click the register button
    const registerButton = page.getByRole('button', { name: /register/i });
    await expect(registerButton).toBeEnabled();
    await registerButton.click();

    // Wait for navigation or error indicator
    await expect(page).toHaveURL('http://localhost:3000/register');

    // Check for error message
    const errorMessage = page.getByText(`Username is already taken`);
    await expect(errorMessage).toBeVisible();
  });

})

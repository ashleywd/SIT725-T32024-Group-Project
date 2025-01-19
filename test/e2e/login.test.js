const { test, expect } = require('@playwright/test');
const { insertTestUser } = require('../../testUtils'); // Adjust the path if necessary

// Define the test block
test.describe('Login Functionality', () => {
  let token;

  test.beforeEach(async ({ page }) => {
    // Insert a test user and navigate to the login page before each test
    const { user, token: generatedToken } = await insertTestUser("testUser", "password123");
    token = generatedToken;
    await page.goto('/login'); 
  });

  // Test if the login page loads successfully
  test('should load the login page', async ({ page }) => {
    const title = await page.title();
    expect(title).toBe('Login'); 
    
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // Test login with valid credentials
  test('should log in successfully with valid credentials', async ({ page }) => {
    await page.fill('#username', 'testUser');
    await page.fill('#password', 'password123');
    
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard'); 
    const url = page.url();
    expect(url).toBe('http://localhost:3000/dashboard');
  });

  // Test login with invalid credentials
  test('should show error message for invalid credentials', async ({ page }) => {
    await page.fill('#username', 'invalidUsername');
    await page.fill('#password', 'invalidPassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    const errorText = await page.textContent('.error-message');
    expect(errorText).toBe('Invalid username or password.'); 
  });

  // Test login with missing username
  test('should show error message for missing username', async ({ page }) => {
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    const errorText = await page.textContent('.error-message');
    expect(errorText).toBe('Username and password are required.');
  });

  // Test login with missing password
  test('should show error message for missing password', async ({ page }) => {
    await page.fill('#username', 'testUser');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    const errorText = await page.textContent('.error-message');
    expect(errorText).toBe('Username and password are required.');
  });
});

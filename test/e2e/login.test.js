const { test, expect } = require('@playwright/test');

// Define the test block
test.describe('Login Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    const { user, generatedToken } = await insertTestUser("testUser", "password123");
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
        await page.fill('#username', 'validUsername');
    await page.fill('#password', 'validPassword');
    
    await page.click('button[type="submit"]');

    
    await page.waitForURL('/dashboard'); 
    const url = page.url();
    expect(url).toBe('http://localhost:3000/dashboard');
  });

  // Test login with invalid credentials
  test('should show error message for invalid credentials', async ({ page }) => {
    
    await page.fill('input[name="username"]', 'invalidUsername');
    await page.fill('input[name="password"]', 'invalidPassword');

    await page.click('button[type="submit"]');

    
    await expect(page.locator('.error-message')).toBeVisible();
    const errorText = await page.textContent('.error-message');
    expect(errorText).toBe('Invalid username or password.'); 
  });
});
